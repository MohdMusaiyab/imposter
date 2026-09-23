package engine

import (
	"errors"
	"math/rand"
	"time"
)

func (r *Room) AddPlayer(playerID, name string) error {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if player, exists := r.Players[playerID]; exists {
		player.Name = name
		return nil
	}

	if r.Phase != PhaseLobby {
		return errors.New("cannot join a match that is already in progress")
	}

	isHost := len(r.Players) == 0
	r.Players[playerID] = &Player{
		ID:     playerID,
		Name:   name,
		IsHost: isHost,
		Order:  len(r.Players),
	}
	return nil
}

// RemovePlayer gracefully excises a user. If mid-match, treats as an elimination / forfeit natively.
func (r *Room) RemovePlayer(playerID string) {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	p, exists := r.Players[playerID]
	if !exists {
		return
	}

	isForfeitHost := p.IsHost

	if r.Phase == PhaseLobby {
		delete(r.Players, playerID)
	} else {
		// Mid-game Forfeit mapping completely natively
		if p.IsDead {
			// Already theoretically eliminated, just transfer host if needed
		} else {
			p.IsDead = true
			if p.IsImposter {
				r.Winner = "CREW"
				r.Phase = PhaseResults
				r.LastEliminated = p.Name + " (Left Match)"
				for _, p := range r.Players {
					if !p.IsImposter {
						p.Score += 100
					}
				}
			} else {
				aliveCount := 0
				for _, op := range r.Players {
					if !op.IsDead {
						aliveCount++
					}
				}
				if aliveCount <= 2 {
					r.Winner = "IMPOSTER"
					r.Phase = PhaseResults
					r.LastEliminated = p.Name + " (Left Match)"
					for _, op := range r.Players {
						if op.IsImposter {
							op.Score += 250
						}
					}
				} else {
					// Manually map automatic state advancement in case the dropped target was blocking sequence naturally
					if r.Phase == PhaseReveal {
						allReady := true
						for _, op := range r.Players {
							if !op.IsDead && !op.IsReady {
								allReady = false
								break
							}
						}
						if allReady { r.Phase = PhaseDiscussion }
					} else if r.Phase == PhaseVoting {
						allVoted := true
						for _, op := range r.Players {
							if !op.IsDead && !op.HasVoted {
								allVoted = false
								break
							}
						}
						if allVoted { r.tallyVotesLocked() }
					}
				}
			}
		}
	}

	// Always dynamically route administrative rights
	if isForfeitHost {
		if r.Phase != PhaseLobby { p.IsHost = false }
		for _, other := range r.Players {
			if r.Phase != PhaseLobby && other.ID == playerID { continue }
			other.IsHost = true
			break
		}
	}
}

func (r *Room) StartGame(crewWord, imposterWord string) error {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if len(r.Players) < 3 && !r.IsSingleDevice {
		return errors.New("need at least 3 players to start")
	}

	r.CrewWord = crewWord
	r.ImposterWord = imposterWord
	r.Phase = PhaseReveal
	r.Winner = "NONE"
	r.LastEliminated = ""

	var pids []string
	for id := range r.Players {
		pids = append(pids, id)
		r.Players[id].IsImposter = false
		r.Players[id].IsDead = false
		r.Players[id].HasVoted = false
		r.Players[id].VotedFor = ""
		r.Players[id].IsReady = false
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	imposterID := pids[rng.Intn(len(pids))]

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

func (r *Room) MarkReady(playerID string) {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if p, ok := r.Players[playerID]; ok {
		p.IsReady = true
	}

	allReady := true
	for _, p := range r.Players {
		if !p.IsDead && !p.IsReady {
			allReady = false
			break
		}
	}
	if allReady && r.Phase == PhaseReveal {
		r.Phase = PhaseDiscussion
	}
}

func (r *Room) AdvanceToDiscussion() {
	r.Mu.Lock()
	defer r.Mu.Unlock()
	r.Phase = PhaseDiscussion
}

func (r *Room) TransitionToVoting() {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	r.Phase = PhaseVoting
	for _, p := range r.Players {
		p.HasVoted = false
		p.VotedFor = ""
	}
}

func (r *Room) RegisterVote(voterID, targetID string) {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if r.Phase != PhaseVoting {
		return
	}

	voter, ok := r.Players[voterID]
	if !ok || voter.IsDead {
		return
	}

	voter.VotedFor = targetID
	voter.HasVoted = true

	allVoted := true
	for _, p := range r.Players {
		if !p.IsDead && !p.HasVoted {
			allVoted = false
			break
		}
	}

	if allVoted {
		r.tallyVotesLocked()
	}
}

// tallyVotesLocked: caller MUST already hold Mu.Lock()
func (r *Room) tallyVotesLocked() {
	votes := make(map[string]int)
	for _, p := range r.Players {
		if !p.IsDead && p.HasVoted {
			votes[p.VotedFor]++
		}
	}

	maxVotes := 0
	eliminatedID := ""
	tie := false
	for tgt, c := range votes {
		if c > maxVotes {
			maxVotes = c
			eliminatedID = tgt
			tie = false
		} else if c == maxVotes {
			tie = true
		}
	}

	r.Phase = PhaseResults

	if tie || eliminatedID == "" {
		r.LastEliminated = "NO ONE (Tie)"
		r.Winner = "NONE"
		return
	}

	elimPlayer := r.Players[eliminatedID]
	elimPlayer.IsDead = true
	r.LastEliminated = elimPlayer.Name

	if elimPlayer.IsImposter {
		r.Winner = "CREW"
		for _, p := range r.Players {
			if !p.IsImposter {
				p.Score += 100
			}
		}
	} else {
		aliveCount := 0
		for _, p := range r.Players {
			if !p.IsDead {
				aliveCount++
			}
		}
		if aliveCount <= 2 {
			r.Winner = "IMPOSTER"
			for _, p := range r.Players {
				if p.IsImposter {
					p.Score += 250
				}
			}
		} else {
			r.Winner = "NONE"
		}
	}
}

// ForceEliminate immediately bypasses secret voting math to support single-device consensus logic
func (r *Room) ForceEliminate(targetID string) {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if r.Phase != PhaseVoting { return }
	
	elimPlayer, ok := r.Players[targetID]
	if !ok || elimPlayer.IsDead { return }

	elimPlayer.IsDead = true
	r.LastEliminated = elimPlayer.Name
	r.Phase = PhaseResults

	if elimPlayer.IsImposter {
		r.Winner = "CREW"
		for _, p := range r.Players {
			if !p.IsImposter { p.Score += 100 }
		}
	} else {
		aliveCount := 0
		for _, p := range r.Players {
			if !p.IsDead { aliveCount++ }
		}
		if aliveCount <= 2 {
			r.Winner = "IMPOSTER"
			for _, p := range r.Players {
				if p.IsImposter { p.Score += 250 }
			}
		} else {
			r.Winner = "NONE"
		}
	}
}

func (r *Room) ResetForNextRound() {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	r.Phase = PhaseLobby
	r.ImposterWord = ""
	r.CrewWord = ""
	r.Winner = ""
	r.LastEliminated = ""

	for _, p := range r.Players {
		p.IsImposter = false
		p.IsDead = false
		p.HasVoted = false
		p.VotedFor = ""
		p.Word = ""
		p.IsReady = false
	}
}
