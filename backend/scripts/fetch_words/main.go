package main

import (
	"fmt"
	"log"
	"os"

	"imposter-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	err := godotenv.Load("../../.env")
	if err != nil {
		_ = godotenv.Load(".env")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("❌ DATABASE_URL is not set. Check your .env file.")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	var words []models.WordPair

	result := db.Limit(50).Find(&words)
	if result.Error != nil {
		log.Fatalf("❌ Error fetching words: %v", result.Error)
	}

	fmt.Printf("\n📚 Fetching first %d words from the database:\n", len(words))
	fmt.Println("--------------------------------------------------")

	for i, wp := range words {
		fmt.Printf("%2d. %-15s (Paired with: %s)\n", i+1, wp.WordA, wp.WordB)
	}

	fmt.Println("--------------------------------------------------")
}
