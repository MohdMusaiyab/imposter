package engine

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
)

// GlobalManager handles the memory map of all active rooms natively.
type GlobalManager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

// Manager is the singleton accessing the room state.
var Manager = &GlobalManager{
	rooms: make(map[string]*Room),
}

// CreateRoom instantiates a fresh room in memory.
func (m *GlobalManager) CreateRoom(isPrivate, isSingleDevice bool) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	code := generateRoomCode()
	// Ensure code is unique (highly likely)
	for m.rooms[code] != nil {
		code = generateRoomCode()
	}

	newRoom := &Room{
		ID:             code,
		IsSingleDevice: isSingleDevice,
		IsPrivate:      isPrivate,
		Phase:          PhaseLobby,
		Players:        make(map[string]*Player),
	}

	m.rooms[code] = newRoom
	return newRoom
}

// GetRoom safely queries the memory map for an ongoing active room.
func (m *GlobalManager) GetRoom(id string) (*Room, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	room, exists := m.rooms[id]
	if !exists {
		return nil, errors.New("room not found or has already expired")
	}
	return room, nil
}

// RemoveRoom cleans up memory universally when a game completes or goes entirely idle.
func (m *GlobalManager) RemoveRoom(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.rooms, id)
}

// GetPublicRooms fetches all lobbies currently open natively, isolating private ones securely
func (m *GlobalManager) GetPublicRooms() []map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var public []map[string]interface{}
	for _, room := range m.rooms {
		if !room.IsPrivate && room.Phase == PhaseLobby {
			public = append(public, map[string]interface{}{
				"id":          room.ID,
				"playerCount": len(room.Players),
			})
		}
	}
	return public
}

// generateRoomCode creates a secure 6-character hex code for joining
func generateRoomCode() string {
	bytes := make([]byte, 3) 
	if _, err := rand.Read(bytes); err != nil {
		return "FALLBK" 
	}
	return hex.EncodeToString(bytes)
}
