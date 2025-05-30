package main

import (
	"log"
	"time"

	"tf2-dashboard/db"
	"tf2-dashboard/scraper"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		log.Printf("Warning: .env file not found at ../../.env")
	}

	if err := db.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	log.Println("Starting TF2 item price scraper...")
	startTime := time.Now()

	if err := scraper.FetchAllItems(); err != nil {
		log.Fatalf("Error fetching items: %v", err)
	}

	duration := time.Since(startTime)
	log.Printf("Scraping completed in %v", duration)
}
