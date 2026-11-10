package engine

import (
	"testing"
	"time"
)

func TestSweepIdleRooms(t *testing.T) {
	mgr := &GlobalManager{
		rooms: make(map[string]*Room),
	}

	freshEmpty := &Room{
		ID:           "FRESH0",
		Players:      make(map[string]*Player),
		LastActivity: time.Now(),
	}
	mgr.rooms[freshEmpty.ID] = freshEmpty

	activeRoom := &Room{
		ID:           "ACTIVE",
		Players:      map[string]*Player{"p1": {ID: "p1", Name: "Alice"}},
		LastActivity: time.Now().Add(-20 * time.Minute),
	}
	mgr.rooms[activeRoom.ID] = activeRoom

	staleEmpty := &Room{
		ID:           "STALE0",
		Players:      make(map[string]*Player),
		LastActivity: time.Now().Add(-15 * time.Minute),
	}
	mgr.rooms[staleEmpty.ID] = staleEmpty

	expiredActive := &Room{
		ID:           "EXPIRE",
		Players:      map[string]*Player{"p2": {ID: "p2", Name: "Bob"}},
		LastActivity: time.Now().Add(-70 * time.Minute),
	}
	mgr.rooms[expiredActive.ID] = expiredActive

	mgr.sweepIdleRooms()

	if _, exists := mgr.rooms["FRESH0"]; !exists {
		t.Error("fresh empty room should not be evicted")
	}
	if _, exists := mgr.rooms["ACTIVE"]; !exists {
		t.Error("active room within TTL should not be evicted")
	}
	if _, exists := mgr.rooms["STALE0"]; exists {
		t.Error("stale empty room older than emptyRoomTTL should be evicted")
	}
	if _, exists := mgr.rooms["EXPIRE"]; exists {
		t.Error("expired room older than roomTTL should be evicted")
	}
}

func TestRoomCodeCollisionResilience(t *testing.T) {
	mgr := &GlobalManager{
		rooms: make(map[string]*Room),
	}

	room1 := mgr.CreateRoom("p1", false, false)
	if room1 == nil || room1.ID == "" {
		t.Fatal("expected valid room to be created")
	}

	room2 := mgr.CreateRoom("p2", false, false)
	if room2 == nil || room2.ID == "" {
		t.Fatal("expected second room to be created")
	}

	if room1.ID == room2.ID {
		t.Errorf("room codes must be unique, both got %s", room1.ID)
	}

	existingID := room1.ID
	mgr.rooms[existingID] = room1

	room3 := mgr.CreateRoom("p3", false, false)
	if room3.ID == existingID {
		t.Errorf("CreateRoom must not overwrite pre-existing room %s", existingID)
	}
	if mgr.rooms[existingID] != room1 {
		t.Error("original room must be preserved")
	}
}
