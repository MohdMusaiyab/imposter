package main

import (
	"log"
	"os"
	"strings"

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

	// 200 High-Quality Pairs (~400 unique words)
	customPairs := []models.WordPair{}

	// 1. Fetch existing word pairs from the DB
	var existingPairs []models.WordPair
	if err := db.Find(&existingPairs).Error; err != nil {
		log.Fatalf("❌ Failed to read existing words: %v", err)
	}

	// 2. Build a map to enforce absolute uniqueness (normalized)
	usedWords := make(map[string]bool)
	for _, p := range existingPairs {
		usedWords[strings.ToLower(strings.TrimSpace(p.WordA))] = true
		usedWords[strings.ToLower(strings.TrimSpace(p.WordB))] = true
	}

	// 3. Filter custom pairs
	var wordsToInsert []models.WordPair
	for _, p := range customPairs {
		normA := strings.ToLower(strings.TrimSpace(p.WordA))
		normB := strings.ToLower(strings.TrimSpace(p.WordB))

		// Check if EITHER word is already in the database OR has been seen in this batch
		if !usedWords[normA] && !usedWords[normB] {
			wordsToInsert = append(wordsToInsert, p)
			usedWords[normA] = true
			usedWords[normB] = true
		} else {
			log.Printf("⚠️  Skipping duplicate word pair: %s / %s", p.WordA, p.WordB)
		}
	}

	if len(wordsToInsert) == 0 {
		log.Println("✅ No new unique words to insert. The database is already up to date.")
		return
	}

	log.Printf("🌱 Attempting to insert %d uniquely new word pairs...", len(wordsToInsert))

	// 4. Batch insert the clean array
	result := db.CreateInBatches(&wordsToInsert, 50)
	if result.Error != nil {
		log.Fatalf("❌ DB Error during insertion: %v", result.Error)
	}

	log.Printf("✅ Success! %d truly unique custom word pairs have been seeded.", len(wordsToInsert))
}
