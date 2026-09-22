package models

import (
	"time"
)

// MatchResult stores the final outcome of games.
// Useful for future analytics, win-rates, and basic leaderboards.
type MatchResult struct {
	ID            uint      `gorm:"primaryKey"`
	RoomCode      string    `gorm:"type:varchar(20);index"`
	Winner        string    `gorm:"type:varchar(50)"` // e.g. "IMPOSTER" or "CREW"
	Duration      int       // Length of match in seconds
	TotalPlayers  int
	ImposterName  string    `gorm:"type:varchar(50)"`
	ImposterWon   bool
	CreatedAt     time.Time
}
