package scraper

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"tf2-dashboard/db"
)

type BackpackTFItem struct {
	Defindex []int  `json:"defindex"`
	Name     string `json:"name"`
	Quality  int    `json:"quality"`
}

type BackpackTFPriceHistory struct {
	Success int `json:"success"`
	History []struct {
		Value     float64 `json:"value"`
		Timestamp int64   `json:"timestamp"`
	} `json:"history"`
}

func FetchAllItems() error {
	apiKey := os.Getenv("BACKPACK_TF_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("BACKPACK_TF_API_KEY not set")
	}

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", "https://backpack.tf/api/IGetPrices/v4", nil)
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("appid", "440")
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading response: %v", err)
	}

	log.Printf("Raw API response: %s", string(body))

	var response struct {
		Response struct {
			Success int `json:"success"`
			Items   map[string]struct {
				Defindex []int                  `json:"defindex"`
				Prices   map[string]interface{} `json:"prices"`
			} `json:"items"`
		} `json:"response"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return fmt.Errorf("error parsing response: %v", err)
	}

	if response.Response.Success != 1 {
		return fmt.Errorf("backpack.tf API error: %s", string(body))
	}

	for itemName, item := range response.Response.Items {
		_ = item 
		var itemID int
		err := db.DB.QueryRow(
			"INSERT INTO items (name, quality) VALUES ($1, $2) ON CONFLICT (name, quality) DO UPDATE SET updated_at = CURRENT_TIMESTAMP RETURNING id",
			itemName,
			0, 
		).Scan(&itemID)
		if err != nil {
			log.Printf("Error inserting item %s: %v", itemName, err)
			continue
		}

		if err := fetchAndStorePriceHistory(itemID, itemName, 0); err != nil {
			log.Printf("Error fetching price history for %s: %v", itemName, err)
			continue
		}

		time.Sleep(1 * time.Second)
	}

	return nil
}

func fetchAndStorePriceHistory(itemID int, itemName string, quality int) error {
	apiKey := os.Getenv("BACKPACK_TF_API_KEY")
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("GET", "https://backpack.tf/api/IGetPriceHistory/v1", nil)
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("item", itemName)
	q.Add("quality", fmt.Sprintf("%d", quality))
	q.Add("appid", "440")
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading response: %v", err)
	}

	log.Printf("Raw API response: %s", string(body))

	var historyResp struct {
		Response struct {
			Success int `json:"success"`
			History []struct {
				Value     float64 `json:"value"`
				Timestamp int64   `json:"timestamp"`
			} `json:"history"`
		} `json:"response"`
	}

	if err := json.Unmarshal(body, &historyResp); err != nil {
		return fmt.Errorf("error parsing history response: %v", err)
	}

	if historyResp.Response.Success != 1 {
		return fmt.Errorf("backpack.tf price history API error for item %s (quality %d)", itemName, quality)
	}

	for _, point := range historyResp.Response.History {
		_, err := db.DB.Exec(
			"INSERT INTO price_history (item_id, price, timestamp) VALUES ($1, $2, $3) ON CONFLICT (item_id, timestamp) DO NOTHING",
			itemID,
			point.Value,
			point.Timestamp,
		)
		if err != nil {
			log.Printf("Error inserting price history point for item %s: %v", itemName, err)
			continue
		}
	}

	return nil
}
