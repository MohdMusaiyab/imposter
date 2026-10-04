package engine

import (
	"errors"
	"math/rand"
	"strings"
	"time"
)

func (r *Room) AddPlayer(playerID, name string) error {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	normalizedName := strings.ReplaceAll(strings.ToLower(name), " ", "")

	if player, exists := r.Players[playerID]; exists {
		for existingID, p := range r.Players {
			if existingID != playerID {
				existingNormalized := strings.ReplaceAll(strings.ToLower(p.Name), " ", "")
				if normalizedName == existingNormalized {
					return errors.New("name already taken by another player")
				}
			}
		}
		player.Name = name
		r.LastActivity = time.Now()
		return nil
	}

	if r.Phase != PhaseLobby {
		return errors.New("cannot join a match that is already in progress")
	}

	for _, p := range r.Players {
		existingNormalized := strings.ReplaceAll(strings.ToLower(p.Name), " ", "")
		if normalizedName == existingNormalized {
			return errors.New("name already taken by another player")
		}
	}

	if len(r.Players) >= 10 {
		return errors.New("room is full (10 players max)")
	}

	isHost := len(r.Players) == 0
	r.Players[playerID] = &Player{
		ID:     playerID,
		Name:   name,
		IsHost: isHost,
		Order:  r.nextOrder,
	}
	r.nextOrder++
	r.LastActivity = time.Now()
	return nil
}

func (r *Room) RemovePlayer(playerID string) {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if r.IsSingleDevice {
		return
	}

	p, exists := r.Players[playerID]
	if !exists {
		return
	}

	isForfeitHost := p.IsHost
	r.LastActivity = time.Now()

	if r.Phase == PhaseLobby {
		delete(r.Players, playerID)
	} else {
		if p.IsDead {
		} else {
			p.IsDead = true

			impostersAlive := 0
			crewAlive := 0
			for _, op := range r.Players {
				if !op.IsDead {
					if op.IsImposter {
						impostersAlive++
					} else {
						crewAlive++
					}
				}
			}

			if impostersAlive == 0 {
				r.Winner = "CREW"
				r.Phase = PhaseResults
				r.LastEliminated = p.Name + " (Left Match)"
				for _, mp := range r.Players {
					if !mp.IsImposter {
						mp.Score += 100
					}
				}
			} else if impostersAlive >= crewAlive {
				r.Winner = "IMPOSTER"
				r.Phase = PhaseResults
				r.LastEliminated = p.Name + " (Left Match)"
				for _, op := range r.Players {
					if op.IsImposter {
						op.Score += 250
					}
				}
			} else {
				if r.Phase == PhaseReveal {
					allReady := true
					for _, op := range r.Players {
						if !op.IsDead && !op.IsReady {
							allReady = false
							break
						}
					}
					if allReady {
						r.Phase = PhaseDiscussion
					}
				} else if r.Phase == PhaseVoting {
					allVoted := true
					for _, op := range r.Players {
						if !op.IsDead && !op.HasVoted {
							allVoted = false
							break
						}
					}
					if allVoted {
						r.tallyVotesLocked()
					}
				}
			}
		}
	}

	if isForfeitHost {
		if r.Phase != PhaseLobby {
			p.IsHost = false
		}
		for _, other := range r.Players {
			if r.Phase != PhaseLobby && other.ID == playerID {
				continue
			}
			other.IsHost = true
			break
		}
	}
}

func (r *Room) StartGame(crewWord, imposterWord string, customImposters int) error {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if len(r.Players) < 3 && !r.IsSingleDevice {
		return errors.New("need at least 3 players to start")
	}

	r.Phase = PhaseReveal
	r.Winner = "NONE"
	r.LastEliminated = ""
	r.LastActivity = time.Now()

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

	numImps := customImposters

	// Sanity check: prevent imposters >= crew
	if numImps >= len(pids)/2 && len(pids) > 3 {
		numImps = (len(pids) / 2) - 1
	} else if numImps >= len(pids) {
		numImps = 1 // absolute fallback for <4 players if user sent high custom override
	}

	if numImps < 1 {
		numImps = 1
	}

	rng.Shuffle(len(pids), func(i, j int) {
		pids[i], pids[j] = pids[j], pids[i]
	})

	if rng.Intn(2) == 0 {
		crewWord, imposterWord = imposterWord, crewWord
	}
	r.CrewWord = crewWord
	r.ImposterWord = imposterWord

	for i, pid := range pids {
		if i < numImps {
			r.Players[pid].IsImposter = true
			r.Players[pid].Word = r.ImposterWord
		} else {
			r.Players[pid].IsImposter = false
			r.Players[pid].Word = r.CrewWord
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
	r.LastActivity = time.Now()
}

func (r *Room) AdvanceToDiscussion() {
	r.Mu.Lock()
	defer r.Mu.Unlock()
	r.Phase = PhaseDiscussion
	r.LastActivity = time.Now()
}

func (r *Room) TransitionToVoting() {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	r.Phase = PhaseVoting
	r.LastActivity = time.Now()
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
	r.LastActivity = time.Now()

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

func (r *Room) ForceEliminate(targetID string) {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	if r.Phase != PhaseVoting {
		return
	}

	elimPlayer, ok := r.Players[targetID]
	if !ok || elimPlayer.IsDead {
		return
	}

	elimPlayer.IsDead = true
	r.LastEliminated = elimPlayer.Name
	r.Phase = PhaseResults
	r.LastActivity = time.Now()

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

func (r *Room) ResetForNextRound() {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	r.Phase = PhaseLobby
	r.ImposterWord = ""
	r.CrewWord = ""
	r.Winner = ""
	r.LastEliminated = ""
	r.LastActivity = time.Now()

	for _, p := range r.Players {
		p.IsImposter = false
		p.IsDead = false
		p.HasVoted = false
		p.VotedFor = ""
		p.Word = ""
		p.IsReady = false
	}
}
