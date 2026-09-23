package main

import (
	"log"
	"os"

	"imposter-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load the root .env file
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

	// Ensure the WordPair table is active before inserting
	db.AutoMigrate(&models.WordPair{})

	// -------------------------------------------------------------
	// ✍️  ADD YOUR CUSTOM WORDS HERE
	// -------------------------------------------------------------
	customWords := []models.WordPair{
		{WordA: "Javascript", WordB: "Typescript"},
		{WordA: "Batman", WordB: "Superman"},
		{WordA: "Winter", WordB: "Summer"},
		{WordA: "Football", WordB: "Soccer"},
		{WordA: "Movie", WordB: "Play"},
		// Just copy and paste another set inside the array!
	}

	log.Printf("🌱 Attempting to insert %d new Word Pairs...", len(customWords))

	result := db.Create(&customWords)
	if result.Error != nil {
		log.Fatalf("❌ DB Error during insertion: %v", result.Error)
	}

	log.Printf("✅ Success! %d custom words have been seeded.", len(customWords))
}
