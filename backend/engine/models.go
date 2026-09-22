package engine

import "sync"

// GamePhase tracks the exact state the room is currently in.
type GamePhase string

const (
	PhaseLobby      GamePhase = "LOBBY"
	PhaseDiscussion GamePhase = "DISCUSSION"
	PhaseVoting     GamePhase = "VOTING"
	PhaseResults    GamePhase = "RESULTS"
)

// Player holds the active session state of a user natively.
type Player struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	IsHost     bool   `json:"isHost"`
	IsImposter bool   `json:"-"` // Hidden from JSON so client cannot cheat
	Word       string `json:"-"` // Hidden from JSON
	IsDead     bool   `json:"isDead"`
	HasVoted   bool   `json:"hasVoted"`
	VotedFor   string `json:"-"` // Hidden target ID
	Score      int    `json:"score"`
}

// Room represents the entire active state of an ongoing game.
type Room struct {
	ID             string
	IsSingleDevice bool
	IsPrivate      bool
	Phase          GamePhase
	Players        map[string]*Player
	
	// Game variables
	ImposterWord string
	CrewWord     string
	
	mu sync.RWMutex
}
