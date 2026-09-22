package engine

import (
	"errors"
	"math/rand"
	"time"
)

// AddPlayer elegantly attaches a player to the room natively, resolving reconnects securely.
func (r *Room) AddPlayer(playerID, name string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// If player already exists in memory map, gracefully handle as a Session Reconnect.
	if player, exists := r.Players[playerID]; exists {
		player.Name = name // Update name strictly just in case they refreshed and renamed
		return nil
	}

	// Completely new players can only join when resting in the Lobby
	if r.Phase != PhaseLobby {
		return errors.New("cannot join a match that is strictly already in progress")
	}
	
	// First arriving player defaults to host physically
	isHost := len(r.Players) == 0

	r.Players[playerID] = &Player{
		ID:     playerID,
		Name:   name,
		IsHost: isHost,
	}
	return nil
}

// StartGame progresses the phase, picks the imposter algorithmically, and assigns words.
func (r *Room) StartGame(crewWord, imposterWord string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Hotseat (SingleDevice) usually has minimums too, but we apply structural 3 min logic securely
	if len(r.Players) < 3 && !r.IsSingleDevice {
		return errors.New("need at least 3 players to logically start the game securely")
	}

	r.CrewWord = crewWord
	r.ImposterWord = imposterWord
	r.Phase = PhaseDiscussion

	// Convert maps to slice for random picking
	var pids []string
	for id := range r.Players {
		pids = append(pids, id)
		// Reset state entirely (in case of multiple rounds looped)
		r.Players[id].IsImposter = false
		r.Players[id].IsDead = false
		r.Players[id].HasVoted = false
		r.Players[id].VotedFor = ""
	}

	// Pick random imposter inherently isolated
	randGenerator := rand.New(rand.NewSource(time.Now().UnixNano()))
	imposterID := pids[randGenerator.Intn(len(pids))]

	// Assign roles natively
	for _, p := range r.Players {
		if p.ID == imposterID {
			p.IsImposter = true
			p.Word = r.ImposterWord
		} else {
			p.Word = r.CrewWord
		}
	}

	return nil
}

// TransitionToVoting safely progresses the match into voting natively.
func (r *Room) TransitionToVoting() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if r.Phase != PhaseDiscussion {
		return errors.New("can only move into voting strictly from the discussion phase")
	}
	
	r.Phase = PhaseVoting
	
	// Reset all existing voting parameters globally for security
	for _, p := range r.Players {
		p.HasVoted = false
		p.VotedFor = ""
	}
	return nil
}

// ResolveRound handles the win condition and point distribution natively.
func (r *Room) ResolveRound(imposterCaught bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if r.Phase != PhaseVoting {
		return errors.New("can only resolve points from the voting phase directly")
	}

	r.Phase = PhaseResults

	for _, p := range r.Players {
		if imposterCaught {
			// Crewmen successfully eliminated the Imposter
			if !p.IsImposter {
				p.Score += 100
			}
		} else {
			// Imposter survived and deceived everyone
			if p.IsImposter {
				p.Score += 250
			}
		}
	}

	return nil
}

// ResetForNextRound prepares the room to play the next round without destroying scores.
func (r *Room) ResetForNextRound() {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.Phase = PhaseLobby
	r.ImposterWord = ""
	r.CrewWord = ""

	for _, p := range r.Players {
		p.IsImposter = false
		p.IsDead = false
		p.HasVoted = false
		p.VotedFor = ""
		p.Word = ""
	}
}
