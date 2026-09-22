package models

import (
	"time"
)

// WordPair represents a set of similar words (e.g., Pizza vs Burger)
// assigned to players. The Imposter gets WordB, everyone else gets WordA.
type WordPair struct {
	ID        uint      `gorm:"primaryKey"`
	WordA     string    `gorm:"type:varchar(100);not null"`
	WordB     string    `gorm:"type:varchar(100);not null"`
	CreatedAt time.Time
}
