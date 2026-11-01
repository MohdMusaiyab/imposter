package engine_test

import (
	"testing"

	"imposter-backend/engine"
)

func createTestRoom(singleDevice bool) *engine.Room {
	return &engine.Room{
		ID:               "TEST01",
		IsSingleDevice:   singleDevice,
		IsPrivate:        false,
		Phase:            engine.PhaseLobby,
		Players:          make(map[string]*engine.Player),
		ActiveCategories: []string{},
		ChatMessages:     []engine.ChatMessage{},
	}
}

func TestAddAndReorderPlayers(t *testing.T) {
	room := createTestRoom(false)

	if err := room.AddPlayer("p1", "Alice"); err != nil {
		t.Fatalf("failed to add player 1: %v", err)
	}
	if err := room.AddPlayer("p2", "Bob"); err != nil {
		t.Fatalf("failed to add player 2: %v", err)
	}
	if err := room.AddPlayer("p3", "Charlie"); err != nil {
		t.Fatalf("failed to add player 3: %v", err)
	}

	// Verify initial order
	if room.Players["p1"].Order != 0 || room.Players["p2"].Order != 1 || room.Players["p3"].Order != 2 {
		t.Errorf("initial player orders incorrect: p1=%d, p2=%d, p3=%d",
			room.Players["p1"].Order, room.Players["p2"].Order, room.Players["p3"].Order)
	}

	// Reorder players: Charlie (0), Alice (1), Bob (2)
	room.ReorderPlayers([]string{"p3", "p1", "p2"})

	if room.Players["p3"].Order != 0 {
		t.Errorf("expected Charlie (p3) order to be 0, got %d", room.Players["p3"].Order)
	}
	if room.Players["p1"].Order != 1 {
		t.Errorf("expected Alice (p1) order to be 1, got %d", room.Players["p1"].Order)
	}
	if room.Players["p2"].Order != 2 {
		t.Errorf("expected Bob (p2) order to be 2, got %d", room.Players["p2"].Order)
	}
}

func TestStartGameMinimumPlayers(t *testing.T) {
	room := createTestRoom(false)
	_ = room.AddPlayer("p1", "Alice")
	_ = room.AddPlayer("p2", "Bob")

	// Multi-device game requires at least 3 players
	err := room.StartGame("Coffee", "Tea", 1)
	if err == nil {
		t.Fatal("expected error starting match with only 2 players in multi-device mode")
	}

	_ = room.AddPlayer("p3", "Charlie")
	err = room.StartGame("Coffee", "Tea", 1)
	if err != nil {
		t.Fatalf("failed to start game with 3 players: %v", err)
	}

	if room.Phase != engine.PhaseReveal {
		t.Errorf("expected PhaseReveal, got %s", room.Phase)
	}

	// Verify words were assigned from the pair
	if room.CrewWord == room.ImposterWord {
		t.Fatalf("crew and imposter words cannot be identical: %s", room.CrewWord)
	}
	validWords := map[string]bool{"Coffee": true, "Tea": true}
	if !validWords[room.CrewWord] || !validWords[room.ImposterWord] {
		t.Fatalf("invalid words assigned: crew=%s, imposter=%s", room.CrewWord, room.ImposterWord)
	}

	// Verify imposter count and role assignment
	imposterCount := 0
	for _, p := range room.Players {
		if p.IsImposter {
			imposterCount++
			if p.Word != room.ImposterWord {
				t.Errorf("expected imposter to get word '%s', got '%s'", room.ImposterWord, p.Word)
			}
		} else {
			if p.Word != room.CrewWord {
				t.Errorf("expected crew to get word '%s', got '%s'", room.CrewWord, p.Word)
			}
		}
	}

	if imposterCount != 1 {
		t.Errorf("expected exactly 1 imposter, got %d", imposterCount)
	}
}

func TestChatSpectatorMute(t *testing.T) {
	room := createTestRoom(false)
	_ = room.AddPlayer("p1", "Alice")
	_ = room.AddPlayer("p2", "Bob")
	_ = room.AddPlayer("p3", "Charlie")

	// 1. In Lobby, everyone can chat
	msg, err := room.AddChatMessage("p1", "Hello team!")
	if err != nil || msg == nil {
		t.Fatalf("expected Alice to chat in lobby, got err: %v", err)
	}

	// 2. Start game and transition to Discussion
	_ = room.StartGame("Pizza", "Burger", 1)
	room.AdvanceToDiscussion()

	// Simulate Alice being eliminated
	room.Players["p1"].IsDead = true

	// Alice (eliminated) should be MUTED during discussion
	_, err = room.AddChatMessage("p1", "I know who it is!")
	if err == nil {
		t.Error("expected dead player to be muted during PhaseDiscussion")
	}

	// Bob (alive) can chat during discussion
	_, err = room.AddChatMessage("p2", "My clue is crust.")
	if err != nil {
		t.Errorf("expected living player to chat during PhaseDiscussion, got: %v", err)
	}

	// Transition to Voting
	room.TransitionToVoting()

	// Alice still muted during voting
	_, err = room.AddChatMessage("p1", "Vote Bob!")
	if err == nil {
		t.Error("expected dead player to be muted during PhaseVoting")
	}

	// Move to Results
	room.Phase = engine.PhaseResults

	// In Results, Alice can chat freely again
	_, err = room.AddChatMessage("p1", "Good game everyone!")
	if err != nil {
		t.Errorf("expected player to chat in PhaseResults, got: %v", err)
	}
}

func TestResetForNextRound(t *testing.T) {
	room := createTestRoom(false)
	_ = room.AddPlayer("p1", "Alice")
	_ = room.AddPlayer("p2", "Bob")
	_ = room.AddPlayer("p3", "Charlie")
	room.ActiveCategories = []string{"FoodDrink"}

	_ = room.StartGame("Dog", "Cat", 1)
	room.Players["p1"].IsDead = true

	// Reset for next round
	room.ResetForNextRound()

	if room.Phase != engine.PhaseLobby {
		t.Errorf("expected PhaseLobby after reset, got %s", room.Phase)
	}

	// Verify categories are preserved across rounds
	if len(room.ActiveCategories) != 1 || room.ActiveCategories[0] != "FoodDrink" {
		t.Errorf("expected active category to persist across rounds, got: %v", room.ActiveCategories)
	}

	// Verify player flags reset
	for _, p := range room.Players {
		if p.IsDead || p.IsImposter || p.Word != "" || p.HasVoted {
			t.Errorf("player %s flags were not cleaned up on reset: %+v", p.Name, p)
		}
	}
}

