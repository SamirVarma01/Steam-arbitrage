package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"tf2-dashboard/db"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

type PriceData struct {
	KeyPriceInRef float64 `json:"keyPriceInRef"`
	RefPriceInUSD float64 `json:"refPriceInUSD"`
	KeyPriceInUSD float64 `json:"keyPriceInUSD"`
	LastUpdated   string  `json:"lastUpdated"`
}
type BackpackTFResponse struct {
	Response struct {
		Success    int `json:"success"`
		Currencies struct {
			Keys struct {
				Price struct {
					Value    float64 `json:"value"`
					ValueRaw float64 `json:"value_raw"`
				} `json:"price"`
			} `json:"keys"`
			Refined struct {
				Price struct {
					Value    float64 `json:"value"`
					ValueRaw float64 `json:"value_raw"`
				} `json:"price"`
			} `json:"refined"`
			USD struct {
				Price struct {
					Value float64 `json:"value"`
				} `json:"price"`
			} `json:"USD"`
		} `json:"currencies"`
	} `json:"response"`
}

type PriceHistoryPoint struct {
	Timestamp int64   `json:"timestamp"`
	Value     float64 `json:"value"`
}

type PriceHistoryResponse struct {
	Item   string              `json:"item"`
	Points []PriceHistoryPoint `json:"points"`
}

func getItemPriceHistory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	rows, err := db.DB.Query(
		"SELECT price, timestamp FROM price_history WHERE item_id = $1 ORDER BY timestamp ASC",
		id,
	)
	if err != nil {
		log.Printf("Error fetching price history: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var price float64
		var timestamp int64
		if err := rows.Scan(&price, &timestamp); err != nil {
			log.Printf("Error scanning price history row: %v", err)
			continue
		}
		history = append(history, map[string]interface{}{
			"price":     price,
			"timestamp": timestamp,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	r := mux.NewRouter()

	r.HandleFunc("/api/prices", getPrices).Methods("GET")
	r.HandleFunc("/api/prices/history", getPriceHistory).Methods("GET")
	r.HandleFunc("/api/items/search", searchItems).Methods("GET")
	r.HandleFunc("/api/items/{id}/history", getItemPriceHistory).Methods("GET")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	srv := &http.Server{
		Handler:      c.Handler(r),
		Addr:         ":8080",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Printf("Server starting on port 8080...")
	log.Fatal(srv.ListenAndServe())
}

func getPrices(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("BACKPACK_TF_API_KEY")
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", "https://backpack.tf/api/IGetCurrencies/v1", nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("appid", "440")
	q.Add("raw", "1")
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error making request: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var bpResponse BackpackTFResponse
	if err := json.Unmarshal(body, &bpResponse); err != nil {
		log.Printf("Error parsing response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if bpResponse.Response.Success != 1 {
		log.Printf("Backpack.tf API error: %s", string(body))
		http.Error(w, "Error fetching prices", http.StatusInternalServerError)
		return
	}

	prices := PriceData{
		KeyPriceInRef: bpResponse.Response.Currencies.Keys.Price.Value,
		RefPriceInUSD: bpResponse.Response.Currencies.Refined.Price.ValueRaw,
		KeyPriceInUSD: bpResponse.Response.Currencies.Keys.Price.ValueRaw,
		LastUpdated:   time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prices)
}

func getPriceHistory(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("BACKPACK_TF_API_KEY")
	if apiKey == "" {
		http.Error(w, "Server configuration error", http.StatusInternalServerError)
		return
	}

	item := r.URL.Query().Get("item")
	quality := r.URL.Query().Get("quality")

	timeframe := r.URL.Query().Get("timeframe")
	if timeframe == "" {
		timeframe = "30days"
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", "https://backpack.tf/api/IGetPriceHistory/v1", nil)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("item", item)
	q.Add("quality", quality)
	q.Add("appid", "440")
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Error fetching price history", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error reading response", http.StatusInternalServerError)
		return
	}

	var apiResp struct {
		Response struct {
			Success int    `json:"success"`
			Message string `json:"message"`
			History []struct {
				Value     float64 `json:"value"`
				Timestamp int64   `json:"timestamp"`
			} `json:"history"`
		} `json:"response"`
	}
	if err := json.Unmarshal(body, &apiResp); err != nil {
		log.Printf("Error parsing history response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if apiResp.Response.Success != 1 {
		log.Printf("Backpack.tf price history API error for item %s (quality %s): %s", item, quality, apiResp.Response.Message)
		http.Error(w, fmt.Sprintf("Error fetching price history: %s", apiResp.Response.Message), http.StatusInternalServerError)
		return
	}

	var cutoff int64
	now := time.Now().Unix()
	switch timeframe {
	case "7days":
		cutoff = now - 7*24*60*60
	case "30days":
		cutoff = now - 30*24*60*60
	case "90days":
		cutoff = now - 90*24*60*60
	case "1year":
		cutoff = now - 365*24*60*60
	case "3years":
		cutoff = now - 3*365*24*60*60
	default:
		cutoff = 0
	}

	filteredPoints := []PriceHistoryPoint{}
	for _, h := range apiResp.Response.History {
		if h.Timestamp >= cutoff {
			filteredPoints = append(filteredPoints, PriceHistoryPoint{
				Timestamp: h.Timestamp,
				Value:     h.Value,
			})
		}
	}

	respData := PriceHistoryResponse{
		Item:   item,
		Points: filteredPoints,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(respData)
}

func searchItems(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		json.NewEncoder(w).Encode([]map[string]interface{}{})
		return
	}

	rows, err := db.DB.Query(
		"SELECT id, name, quality FROM items WHERE name ILIKE $1 ORDER BY name LIMIT 5",
		"%"+query+"%",
	)
	if err != nil {
		log.Printf("Error searching items: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		var quality int
		if err := rows.Scan(&id, &name, &quality); err != nil {
			log.Printf("Error scanning item row: %v", err)
			continue
		}
		items = append(items, map[string]interface{}{
			"id":      id,
			"name":    name,
			"quality": quality,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}
