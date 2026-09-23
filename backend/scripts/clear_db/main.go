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
	// Load the root .env file from the backend directory
	err := godotenv.Load("../../.env")
	if err != nil {
		// Fallback to searching the current dir if run from root using `go run scripts/clear_db/main.go`
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

	log.Println("🗑️  Dropping all game tables (WordPairs & MatchResults)...")
	
	// Drop tables forcefully to reset schemas entirely
	err = db.Migrator().DropTable(&models.WordPair{}, &models.MatchResult{})
	if err != nil {
		log.Fatalf("❌ Error dropping tables: %v", err)
	}

	log.Println("✅ Database tables deleted successfully!")
	log.Println("💡 They will be automatically recreated next time you boot the server.")
}
