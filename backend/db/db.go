package db

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"imposter-backend/models"
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

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get generic database object: %v", err)
	}
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(25)

	log.Println("Running Auto-Migration for DB schemas...")
	if err = DB.AutoMigrate(&models.WordPair{}, &models.MatchResult{}); err != nil {
		return fmt.Errorf("failed to migrate tables: %v", err)
	}

	log.Println("✅ Successfully connected & synced with Neon PostgreSQL via GORM")
	return nil
}
