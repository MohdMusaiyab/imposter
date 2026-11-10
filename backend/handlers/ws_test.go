package handlers

import (
	"testing"
	"time"

	"imposter-backend/engine"
)

func TestMapRoomStateRoleSecrecy(t *testing.T) {
	room := &engine.Room{
		ID:             "SECRET1",
		Phase:          engine.PhaseResults,
		Winner:         "NONE",
		IsSingleDevice: false,
		Players:        make(map[string]*engine.Player),
		LastActivity:   time.Now(),
	}

	room.Players["p1"] = &engine.Player{ID: "p1", Name: "Alice", Word: "Coffee", IsImposter: false, IsDead: false}
	room.Players["p2"] = &engine.Player{ID: "p2", Name: "Bob", Word: "Tea", IsImposter: true, IsDead: false}
	room.Players["p3"] = &engine.Player{ID: "p3", Name: "Charlie", Word: "Coffee", IsImposter: false, IsDead: false}
	room.Players["p4"] = &engine.Player{ID: "p4", Name: "David", Word: "Coffee", IsImposter: false, IsDead: true}

	state := mapRoomState(room, "p1")
	players, ok := state["Players"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected Players map in state")
	}

	p1Data := players["p1"].(map[string]interface{})
	if p1Data["Word"] != "Coffee" {
		t.Errorf("p1 should see their own word, got %v", p1Data["Word"])
	}

	p2Data := players["p2"].(map[string]interface{})
	if _, exists := p2Data["Word"]; exists {
		t.Errorf("alive imposter p2 word must not be exposed to p1 during active match")
	}
	if _, exists := p2Data["IsImposter"]; exists {
		t.Errorf("alive imposter p2 role must not be exposed to p1 during active match")
	}

	p3Data := players["p3"].(map[string]interface{})
	if _, exists := p3Data["Word"]; exists {
		t.Errorf("alive crew p3 word must not be exposed to p1 during active match")
	}

	p4Data := players["p4"].(map[string]interface{})
	if _, exists := p4Data["Word"]; exists {
		t.Errorf("dead player p4 secret word must not be exposed to p1 during active match")
	}
	if p4Data["IsImposter"] != false {
		t.Errorf("dead player p4 IsImposter should be revealed, got %v", p4Data["IsImposter"])
	}

	room.Winner = "CREW"
	gameOverState := mapRoomState(room, "p1")
	goPlayers := gameOverState["Players"].(map[string]interface{})
	p2GameOver := goPlayers["p2"].(map[string]interface{})
	if p2GameOver["Word"] != "Tea" || p2GameOver["IsImposter"] != true {
		t.Errorf("all roles and words must be revealed upon game over, got %+v", p2GameOver)
	}
}
