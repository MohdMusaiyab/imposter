package models

import (
	"time"
)

type WordPair struct {
	ID        uint   `gorm:"primaryKey"`
	WordA     string `gorm:"type:varchar(100);not null"`
	WordB     string `gorm:"type:varchar(100);not null"`
	CreatedAt time.Time
}
