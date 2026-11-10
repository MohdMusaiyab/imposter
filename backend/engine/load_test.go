package engine_test

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"imposter-backend/engine"
)

// ============================================================================
// CONCURRENCY & RACE-CONDITION STRESS TESTS
// Run with: go test -v -race -run="Stress" ./engine/...
// ============================================================================

// TestConcurrentVotingStress simulates 12 players in a room casting votes
// at the exact same millisecond across separate goroutines.
// This validates that sync.RWMutex prevents race conditions and that the
// vote tally transitions the room phase atomically without dropping votes.
func TestConcurrentVotingStress(t *testing.T) {
	const numPlayers = 12
	room := &engine.Room{
		ID:           "STRESS_VOTE",
		Phase:        engine.PhaseVoting,
		Players:      make(map[string]*engine.Player),
		ChatMessages: []engine.ChatMessage{},
		LastActivity: time.Now(),
	}

	for i := 0; i < numPlayers; i++ {
		pid := fmt.Sprintf("p_%d", i)
		room.Players[pid] = &engine.Player{
			ID:       pid,
			Name:     fmt.Sprintf("Player %d", i),
			IsDead:   false,
			HasVoted: false,
		}
	}

	var wg sync.WaitGroup
	startSignal := make(chan struct{})

	// All 12 players vote simultaneously for player "p_0"
	for i := 0; i < numPlayers; i++ {
		wg.Add(1)
		go func(playerIdx int) {
			defer wg.Done()
			<-startSignal // sync goroutine launch to exact instant
			voterID := fmt.Sprintf("p_%d", playerIdx)
			room.RegisterVote(voterID, "p_0")
		}(i)
	}

	// Release all goroutines simultaneously
	close(startSignal)
	wg.Wait()

	room.Mu.RLock()
	defer room.Mu.RUnlock()

	// Every player must have their HasVoted flag true
	for pid, p := range room.Players {
		if !p.HasVoted {
			t.Errorf("player %s vote was dropped or missed during concurrent barrage", pid)
		}
	}

	// Since all players voted, phase must have transitioned to PhaseResults
	if room.Phase != engine.PhaseResults {
		t.Errorf("expected room to transition to PhaseResults after all votes, got %s", room.Phase)
	}

	// Player p_0 ("Player 0") received all 12 votes and must be eliminated
	if room.LastEliminated != "Player 0" {
		t.Errorf("expected Player 0 to be eliminated, got %s", room.LastEliminated)
	}
}

// TestConcurrentChatFlood simulates 12 players sending thousands of messages
// simultaneously. This stresses the rolling 80-message buffer and tests for
// slice out-of-bounds, race conditions, or memory corruption under write load.
func TestConcurrentChatFlood(t *testing.T) {
	const numPlayers = 12
	const messagesPerPlayer = 100 // 1,200 messages total
	room := &engine.Room{
		ID:           "STRESS_CHAT",
		Phase:        engine.PhaseDiscussion,
		Players:      make(map[string]*engine.Player),
		ChatMessages: []engine.ChatMessage{},
		LastActivity: time.Now(),
	}

	for i := 0; i < numPlayers; i++ {
		pid := fmt.Sprintf("p_%d", i)
		room.Players[pid] = &engine.Player{
			ID:     pid,
			Name:   fmt.Sprintf("Player %d", i),
			IsDead: false,
		}
	}

	var wg sync.WaitGroup
	startSignal := make(chan struct{})

	for i := 0; i < numPlayers; i++ {
		wg.Add(1)
		go func(playerIdx int) {
			defer wg.Done()
			pid := fmt.Sprintf("p_%d", playerIdx)
			<-startSignal
			for m := 0; m < messagesPerPlayer; m++ {
				_, err := room.AddChatMessage(pid, fmt.Sprintf("Rapid message %d from %s", m, pid))
				if err != nil {
					t.Errorf("unexpected error sending chat: %v", err)
				}
			}
		}(i)
	}

	close(startSignal)
	wg.Wait()

	room.Mu.RLock()
	defer room.Mu.RUnlock()

	// Buffer must be capped at exactly 80 items
	if len(room.ChatMessages) != 80 {
		t.Errorf("expected buffer to cap at 80 messages, got %d", len(room.ChatMessages))
	}
}

// TestHighLoadMultiRoomSimulation simulates 100 rooms running concurrently,
// with 8 players per room (800 players total) simultaneously joining, starting,
// sending chat messages, and casting votes.
func TestHighLoadMultiRoomSimulation(t *testing.T) {
	const numRooms = 100
	const playersPerRoom = 8
	var totalOperations int64

	var wg sync.WaitGroup
	startSignal := make(chan struct{})

	for r := 0; r < numRooms; r++ {
		wg.Add(1)
		go func(roomIdx int) {
			defer wg.Done()
			roomID := fmt.Sprintf("ROOM_%03d", roomIdx)
			room := &engine.Room{
				ID:           roomID,
				Phase:        engine.PhaseLobby,
				Players:      make(map[string]*engine.Player),
				ChatMessages: []engine.ChatMessage{},
				LastActivity: time.Now(),
			}

			<-startSignal

			// 1. Concurrent Player Join
			for p := 0; p < playersPerRoom; p++ {
				pid := fmt.Sprintf("p_%d_%d", roomIdx, p)
				if err := room.AddPlayer(pid, fmt.Sprintf("User %d", p)); err != nil {
					t.Errorf("failed to add player: %v", err)
				}
				atomic.AddInt64(&totalOperations, 1)
			}

			// 2. Start Game
			if err := room.StartGame("Apple", "Orange", 1); err != nil {
				t.Errorf("failed to start game: %v", err)
			}
			atomic.AddInt64(&totalOperations, 1)

			// 3. Discussion Phase & Chat Activity
			room.AdvanceToDiscussion()
			for p := 0; p < playersPerRoom; p++ {
				pid := fmt.Sprintf("p_%d_%d", roomIdx, p)
				_, _ = room.AddChatMessage(pid, "Clue: Round fruit")
				atomic.AddInt64(&totalOperations, 1)
			}

			// 4. Voting Phase & Concurrent Ballots
			room.TransitionToVoting()
			target := fmt.Sprintf("p_%d_0", roomIdx)
			for p := 0; p < playersPerRoom; p++ {
				pid := fmt.Sprintf("p_%d_%d", roomIdx, p)
				room.RegisterVote(pid, target)
				atomic.AddInt64(&totalOperations, 1)
			}

			// Verify outcome
			room.Mu.RLock()
			if room.Phase != engine.PhaseResults {
				t.Errorf("room %s failed to transition to Results under load, got %s", roomID, room.Phase)
			}
			room.Mu.RUnlock()
		}(r)
	}

	close(startSignal)
	wg.Wait()

	t.Logf("Successfully executed %d discrete state operations across %d concurrent rooms (%d players)",
		atomic.LoadInt64(&totalOperations), numRooms, numRooms*playersPerRoom)
}

// TestConcurrentJoinLeaveReorder simulates players rapidly joining, leaving,
// and reordering while chat messages and state reads happen concurrently.
func TestConcurrentJoinLeaveReorder(t *testing.T) {
	room := &engine.Room{
		ID:           "JOIN_LEAVE_LOAD",
		Phase:        engine.PhaseLobby,
		Players:      make(map[string]*engine.Player),
		ChatMessages: []engine.ChatMessage{},
		LastActivity: time.Now(),
	}

	var wg sync.WaitGroup
	startSignal := make(chan struct{})

	// 8 goroutines concurrently joining, chatting, reordering, and leaving
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			pid := fmt.Sprintf("p_%d", idx)
			<-startSignal

			for cycle := 0; cycle < 20; cycle++ {
				// Join
				_ = room.AddPlayer(pid, fmt.Sprintf("Player %d", idx))

				// Chat
				_, _ = room.AddChatMessage(pid, "Hello room")

				// Reorder
				room.ReorderPlayers([]string{pid})

				// Leave
				room.RemovePlayer(pid)
			}
		}(i)
	}

	close(startSignal)
	wg.Wait()

	room.Mu.RLock()
	defer room.Mu.RUnlock()

	// Ensure no deadlocks or memory corruption occurred
	if len(room.Players) > 8 {
		t.Errorf("unexpected player count: %d", len(room.Players))
	}
}

// ============================================================================
// PERFORMANCE & LOAD BENCHMARKS
// Run with: go test -v -bench=. -benchmem ./engine/...
// ============================================================================

// BenchmarkRoomChatThroughput measures how many chat messages per second the
// in-memory engine can process, append, and FIFO-cap per second.
func BenchmarkRoomChatThroughput(b *testing.B) {
	room := &engine.Room{
		ID:           "BENCH_CHAT",
		Phase:        engine.PhaseDiscussion,
		Players:      make(map[string]*engine.Player),
		ChatMessages: []engine.ChatMessage{},
		LastActivity: time.Now(),
	}

	_ = room.AddPlayer("p1", "Alice")

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, _ = room.AddChatMessage("p1", "Benchmarking chat throughput under heavy load")
		}
	})
}

// BenchmarkConcurrentVoting measures the throughput of concurrent vote registration
// and instant tallying.
func BenchmarkConcurrentVoting(b *testing.B) {
	room := &engine.Room{
		ID:           "BENCH_VOTE",
		Phase:        engine.PhaseVoting,
		Players:      make(map[string]*engine.Player),
		ChatMessages: []engine.ChatMessage{},
		LastActivity: time.Now(),
	}

	for i := 0; i < 8; i++ {
		pid := fmt.Sprintf("p_%d", i)
		room.Players[pid] = &engine.Player{ID: pid, Name: pid, IsDead: false}
	}

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			voterID := fmt.Sprintf("p_%d", i%8)
			targetID := fmt.Sprintf("p_%d", (i+1)%8)
			room.RegisterVote(voterID, targetID)
			i++
		}
	})
}

// BenchmarkMultiRoomLoad simulates concurrent creation, lookup, and updates
// across many independent rooms.
func BenchmarkMultiRoomLoad(b *testing.B) {
	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			r := engine.Manager.CreateRoom("", false, false)
			_ = r.AddPlayer("p1", "BenchUser")
			_, _ = r.AddChatMessage("p1", "Load test")
		}
	})
}
