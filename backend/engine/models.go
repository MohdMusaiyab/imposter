package engine

import "sync"

type GamePhase string

const (
	PhaseLobby      GamePhase = "LOBBY"
	PhaseReveal     GamePhase = "REVEAL"
	PhaseDiscussion GamePhase = "DISCUSSION"
	PhaseVoting     GamePhase = "VOTING"
	PhaseResults    GamePhase = "RESULTS"
)

type Player struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	IsHost     bool   `json:"isHost"`
	IsImposter bool   `json:"-"`
	Word       string `json:"-"`
	IsDead     bool   `json:"isDead"`
	HasVoted   bool   `json:"hasVoted"`
	VotedFor   string `json:"-"`
	Score      int    `json:"score"`
	IsReady    bool   `json:"isReady"`
	Order      int    `json:"order"`
}

type Room struct {
	ID             string
	IsSingleDevice bool
	IsPrivate      bool
	Phase          GamePhase
	Players        map[string]*Player
	ImposterWord   string
	CrewWord       string
	LastEliminated string
	Winner         string

	Mu sync.RWMutex // Exported so handlers can lock during broadcast
}

// SafeGetMeta returns a safe copy of top-level room metadata without the players map
func (r *Room) SafeGetMeta() (id, phase, winner, lastElim string, isSingle, isPrivate bool) {
	r.Mu.RLock()
	defer r.Mu.RUnlock()
	return r.ID, string(r.Phase), r.Winner, r.LastEliminated, r.IsSingleDevice, r.IsPrivate
}
