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
	roomTTL = 60 * time.Minute

	cleanupInterval = 10 * time.Minute
)

type GlobalManager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

var Manager = &GlobalManager{
	rooms: make(map[string]*Room),
}

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
	attempts := 0
	for m.rooms[code] != nil {
		code = generateRoomCode()
		attempts++
		if attempts > 100 {
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

func (m *GlobalManager) GetPublicRooms() []map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var public []map[string]interface{}
	for _, room := range m.rooms {
		if !room.IsPrivate && room.Phase == PhaseLobby {
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

func generateRoomCode() string {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "FALLBK"
	}
	return strings.ToUpper(hex.EncodeToString(b))
}
