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
	// Load the root .env file from the backend directory
	err := godotenv.Load("../../.env")
	if err != nil {
		_ = godotenv.Load(".env")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("❌ DATABASE_URL is not set. Check your .env file.")
	}

	// Connect to the DB
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	var words []models.WordPair
	
	// Fetch the first 50 entries
	result := db.Limit(50).Find(&words)
	if result.Error != nil {
		log.Fatalf("❌ Error fetching words: %v", result.Error)
	}

	fmt.Printf("\n📚 Fetching first %d words from the database:\n", len(words))
	fmt.Println("--------------------------------------------------")
	
	for i, wp := range words {
		// I'm printing WordA primarily as you asked, but including WordB in brackets 
		// so you can actually judge the "quality" of the pair's relationship!
		fmt.Printf("%2d. %-15s (Paired with: %s)\n", i+1, wp.WordA, wp.WordB)
	}
	
	fmt.Println("--------------------------------------------------")
}
