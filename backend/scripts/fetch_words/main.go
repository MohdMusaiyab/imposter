package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"imposter-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type WordExportItem struct {
	ID       uint            `json:"id"`
	WordA    string          `json:"word_a"`
	WordB    string          `json:"word_b"`
	Category models.Category `json:"category"`
}

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

	// Ensure category column exists
	if err := db.AutoMigrate(&models.WordPair{}); err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}

	var words []models.WordPair
	result := db.Order("id ASC").Find(&words)
	if result.Error != nil {
		log.Fatalf("❌ Error fetching words: %v", result.Error)
	}

	fmt.Printf("\n📚 Total Word Pairs in Database: %d\n", len(words))
	fmt.Println("==========================================================================================")
	fmt.Printf("%-7s | %-20s | %-20s | %-28s\n", "ID", "WORD A", "WORD B", "CATEGORY")
	fmt.Println("------------------------------------------------------------------------------------------")

	var exportList []WordExportItem
	for _, wp := range words {
		fmt.Printf("#%-6d | %-20s | %-20s | %-28s\n", wp.ID, wp.WordA, wp.WordB, wp.Category)
		exportList = append(exportList, WordExportItem{
			ID:       wp.ID,
			WordA:    wp.WordA,
			WordB:    wp.WordB,
			Category: wp.Category,
		})
	}
	fmt.Println("==========================================================================================")

	// Also write to words_dump.json for easy viewing and editing
	dumpFile := "words_dump.json"
	fileData, err := json.MarshalIndent(exportList, "", "  ")
	if err == nil {
		if err := os.WriteFile(dumpFile, fileData, 0644); err == nil {
			fmt.Printf("💾 Saved clean JSON dump with all IDs to: %s\n\n", dumpFile)
		}
	}
}
