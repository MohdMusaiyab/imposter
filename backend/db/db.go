package db

import (
	"fmt"
	"log"
	"os"

	"imposter-backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is missing")
	}

	var err error

	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect database: %v", err)
	}

	// 1. Configure the connection pool BEFORE any DB operations.
	//    Previously these limits were applied after AutoMigrate and Seed
	//    ran, meaning those heavy queries could briefly exhaust Neon's
	//    free-tier connection limit on cold starts.
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get generic database object: %v", err)
	}
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(25)

	// 2. AutoMigrate runs with a properly capped pool now
	log.Println("Running Auto-Migration for DB schemas...")
	if err = DB.AutoMigrate(&models.WordPair{}, &models.MatchResult{}); err != nil {
		return fmt.Errorf("failed to migrate tables: %v", err)
	}

	// 3. Seed default word pairs if the dictionary is empty
	SeedDatabase(DB)

	log.Println("✅ Successfully connected & synced with Neon PostgreSQL via GORM")
	return nil
}
