package engine

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
)

type GlobalManager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

var Manager = &GlobalManager{
	rooms: make(map[string]*Room),
}

func (m *GlobalManager) CreateRoom(isPrivate, isSingleDevice bool) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	code := generateRoomCode()
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
			public = append(public, map[string]interface{}{
				"id":          room.ID,
				"playerCount": len(room.Players),
			})
		}
	}
	return public
}

func generateRoomCode() string {
	bytes := make([]byte, 3)
	if _, err := rand.Read(bytes); err != nil {
		return "FALLBK"
	}
	return strings.ToUpper(hex.EncodeToString(bytes))
}
