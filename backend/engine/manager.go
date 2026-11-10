package engine

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"
)

const (
	roomTTL         = 60 * time.Minute
	emptyRoomTTL    = 10 * time.Minute
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
		timeSinceActivity := now.Sub(room.LastActivity)
		isStale := timeSinceActivity > roomTTL || (len(room.Players) == 0 && timeSinceActivity > emptyRoomTTL)
		room.Mu.RUnlock()
		if isStale {
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

func (m *GlobalManager) CreateRoom(creatorID string, isPrivate, isSingleDevice bool) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	codeBytes := 3
	code := generateRoomCode(codeBytes)
	attempts := 0
	for m.rooms[code] != nil {
		attempts++
		if attempts > 50 {
			codeBytes = 4
		}
		code = generateRoomCode(codeBytes)
		if attempts > 100 {
			code = fmt.Sprintf("%s%d", generateRoomCode(4), time.Now().UnixNano()%1000)
			break
		}
	}

	newRoom := &Room{
		ID:             code,
		CreatorID:      creatorID,
		IsSingleDevice: isSingleDevice,
		IsPrivate:      isPrivate,
		Phase:            PhaseLobby,
		Players:          make(map[string]*Player),
		ActiveCategories: []string{},
		ChatMessages:     []ChatMessage{},
		KickedIDs:        make(map[string]bool),
		LastActivity:     time.Now(),
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
		if !room.IsPrivate && !room.IsSingleDevice && room.Phase == PhaseLobby {
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

func generateRoomCode(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return strings.ToUpper(hex.EncodeToString([]byte(fmt.Sprintf("%d", time.Now().UnixNano()))[:n]))
	}
	return strings.ToUpper(hex.EncodeToString(b))
}
