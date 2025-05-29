package db

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() error {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("error connecting to database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("error pinging database: %v", err)
	}

	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(25)
	DB.SetConnMaxLifetime(5 * time.Minute)

	if err = createTables(); err != nil {
		return fmt.Errorf("error creating tables: %v", err)
	}

	return nil
}

func createTables() error {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS items (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			quality INTEGER NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(name, quality)
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating items table: %v", err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS price_history (
			id SERIAL PRIMARY KEY,
			item_id INTEGER REFERENCES items(id),
			price DECIMAL(10, 2) NOT NULL,
			timestamp BIGINT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(item_id, timestamp)
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating price_history table: %v", err)
	}

	_, err = DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_price_history_item_id ON price_history(item_id);
		CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
	`)
	if err != nil {
		return fmt.Errorf("error creating indexes: %v", err)
	}

	return nil
}
