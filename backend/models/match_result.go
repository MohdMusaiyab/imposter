package models

import (
	"time"
)

type MatchResult struct {
	ID           uint   `gorm:"primaryKey"`
	RoomCode     string `gorm:"type:varchar(20);index"`
	Winner       string `gorm:"type:varchar(50)"`
	Duration     int
	TotalPlayers int
	ImposterName string `gorm:"type:varchar(50)"`
	ImposterWon  bool
	CreatedAt    time.Time
}
