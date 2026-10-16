package models

import (
	"time"
)

type WordPair struct {
	ID        uint     `gorm:"primaryKey"`
	WordA     string   `gorm:"type:varchar(100);not null"`
	WordB     string   `gorm:"type:varchar(100);not null"`
	Category  Category `gorm:"type:varchar(60);not null;default:'KitchenHouseholdObjects';index"`
	CreatedAt time.Time
}
