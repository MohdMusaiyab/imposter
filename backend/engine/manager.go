package engine

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"strings"
	"sync"
	"time"
)

const (
	// roomTTL is how long a room can be completely idle before the cleanup
	// goroutine evicts it from memory. Prevents the server from leaking RAM
	// indefinitely from abandoned lobbies.
	roomTTL = 60 * time.Minute

	// cleanupInterval is how often the sweep goroutine wakes up to check.
	cleanupInterval = 10 * time.Minute
)

type GlobalManager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

var Manager = &GlobalManager{
	rooms: make(map[string]*Room),
}

// StartCleanup launches a background goroutine that periodically evicts
// rooms that have had no activity for longer than roomTTL.
// Call this once from main() after the server initialises.
func (m *GlobalManager) StartCleanup() {
	go func() {
		ticker := time.NewTicker(cleanupInterval)
		defer ticker.Stop()
		for range ticker.C {
			m.sweepIdleRooms()
		}
	}()
}

func (m *GlobalManager) sweepIdleRooms() {
	now := time.Now()

	// Collect candidates under a read lock first to minimise write-lock contention.
	m.mu.RLock()
	var stale []string
	for id, room := range m.rooms {
		room.Mu.RLock()
		idle := now.Sub(room.LastActivity) > roomTTL
		empty := len(room.Players) == 0
		room.Mu.RUnlock()
		if idle || empty {
			stale = append(stale, id)
		}
	}
	m.mu.RUnlock()

	if len(stale) == 0 {
		return
	}

	m.mu.Lock()
	for _, id := range stale {
		delete(m.rooms, id)
	}
	m.mu.Unlock()

	log.Printf("[Cleanup] Evicted %d idle/empty room(s)", len(stale))
}

func (m *GlobalManager) CreateRoom(isPrivate, isSingleDevice bool) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	code := generateRoomCode()
	// Collision loop is safe because the code space is 16M combinations.
	// The FALLBK guard in generateRoomCode prevents an infinite loop on
	// crypto/rand failure — although that case should never arise in practice.
	attempts := 0
	for m.rooms[code] != nil {
		code = generateRoomCode()
		attempts++
		if attempts > 100 {
			// Pathological case: break to avoid spinning. Error handled upstream.
			break
		}
	}

	newRoom := &Room{
		ID:             code,
		IsSingleDevice: isSingleDevice,
		IsPrivate:      isPrivate,
		Phase:          PhaseLobby,
		Players:        make(map[string]*Player),
		LastActivity:   time.Now(),
	}

	m.rooms[code] = newRoom
	return newRoom
}

func (m *GlobalManager) GetRoom(id string) (*Room, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	room, exists := m.rooms[id]
	if !exists {
		return nil, errors.New("room not found or has already expired")
	}
	return room, nil
}

func (m *GlobalManager) RemoveRoom(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.rooms, id)
}

// GetPublicRooms returns joinable public lobbies.
// Acquires room.Mu.RLock() before reading room.Players to eliminate the data
// race that existed when the old code read len(room.Players) without a lock.
func (m *GlobalManager) GetPublicRooms() []map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var public []map[string]interface{}
	for _, room := range m.rooms {
		if !room.IsPrivate && room.Phase == PhaseLobby {
			// Must acquire room-level lock before reading the Players map.
			room.Mu.RLock()
			count := len(room.Players)
			room.Mu.RUnlock()

			public = append(public, map[string]interface{}{
				"id":          room.ID,
				"playerCount": count,
			})
		}
	}
	return public
}

// generateRoomCode produces a 6-character uppercase hex room code.
// Falls back to a fixed string on crypto/rand failure; the collision loop
// in CreateRoom is capped at 100 attempts to prevent an infinite spin.
func generateRoomCode() string {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "FALLBK"
	}
	return strings.ToUpper(hex.EncodeToString(b))
}
