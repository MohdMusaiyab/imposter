package db

import (
	"log"

	"imposter-backend/models"
	"gorm.io/gorm"
)

// SeedDatabase ensures our DB always has a basic dictionary of words to run.
func SeedDatabase(db *gorm.DB) {
	var count int64
	db.Model(&models.WordPair{}).Count(&count)

	// If words already exist, abort seeding to avoid duplicates.
	if count > 0 {
		log.Println("Word dictionary already populated. Skipping seed.")
		return
	}

	log.Println("Seeding primary word dictionary...")

	defaultPairs := []models.WordPair{
		{WordA: "Burger", WordB: "Pizza"},
		{WordA: "Ocean", WordB: "Sea"},
		{WordA: "Laptop", WordB: "Computer"},
		{WordA: "Guitar", WordB: "Violin"},
		{WordA: "Dog", WordB: "Wolf"},
		{WordA: "Apple", WordB: "Orange"},
		{WordA: "Car", WordB: "Truck"},
		{WordA: "Mountain", WordB: "Hill"},
		{WordA: "House", WordB: "Apartment"},
		{WordA: "Shoes", WordB: "Boots"},
		{WordA: "River", WordB: "Lake"},
		{WordA: "Sword", WordB: "Knife"},
		{WordA: "Jacket", WordB: "Coat"},
		{WordA: "Tea", WordB: "Coffee"},
		{WordA: "Train", WordB: "Bus"},
	}

	if err := db.Create(&defaultPairs).Error; err != nil {
		log.Printf("Failed to seed database: %v\n", err)
	} else {
		log.Printf("Successfully seeded %d default word pairs.\n", len(defaultPairs))
	}
}
