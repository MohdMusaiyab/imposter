package handlers

import (
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"imposter-backend/db"
	"imposter-backend/engine"
	"imposter-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

const (
	pingInterval = 15 * time.Second
	pongWait = 20 * time.Second
	writeWait = 10 * time.Second
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		allowedOrigin := os.Getenv("FRONTEND_URL")
		if allowedOrigin == "" {
			return true
		}
		
		origin := r.Header.Get("Origin")
		return origin == allowedOrigin
	},
}

var (
	roomClients = make(map[string]map[string]*websocket.Conn)
	connMutex   = sync.RWMutex{}
)

func ServeWS(c *gin.Context) {
	roomID := c.Param("roomId")
	playerID := c.Query("playerId")
	playerName := c.Query("playerName")

	if playerID == "" || playerName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing player credentials"})
		return
	}

	if len(playerName) > 30 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Player name too long (max 30 chars)"})
		return
	}

	room, err := engine.Manager.GetRoom(roomID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WS Upgrade Error: %v", err)
		return
	}

	if err := room.AddPlayer(playerID, playerName); err != nil {
		conn.WriteJSON(gin.H{"error": err.Error()})
		conn.Close()
		return
	}

	connMutex.Lock()
	if roomClients[roomID] == nil {
		roomClients[roomID] = make(map[string]*websocket.Conn)
	}
	roomClients[roomID][playerID] = conn
	connMutex.Unlock()

	broadcastStateToRoom(room)

	go readPump(conn, room, playerID)
	go writePump(conn, room, playerID)
}

// writePump runs the server-side ping heartbeat on its own goroutine.
func writePump(conn *websocket.Conn, room *engine.Room, playerID string) {
	ticker := time.NewTicker(pingInterval)
	defer ticker.Stop()

	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// Set the initial read deadline so the very first silence is caught too.
	conn.SetReadDeadline(time.Now().Add(pongWait))

	for {
		<-ticker.C

		// Check if this player is still registered (they may have left cleanly).
		connMutex.RLock()
		_, active := roomClients[room.ID][playerID]
		connMutex.RUnlock()
		if !active {
			return
		}

		conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
			// Client is dead — readPump will handle cleanup via its own error path.
			return
		}
	}
}

func readPump(conn *websocket.Conn, room *engine.Room, playerID string) {
	defer func() {
		// Remove from the live connection map immediately on disconnect.
		connMutex.Lock()
		if roomClients[room.ID] != nil {
			delete(roomClients[room.ID], playerID)
		}
		connMutex.Unlock()
		conn.Close()

		// Grace period: give the client 10 seconds to reconnect (e.g. page refresh)
		// before treating the absence as a permanent leave.
		go func() {
			time.Sleep(10 * time.Second)
			connMutex.RLock()
			_, stillConnected := roomClients[room.ID][playerID]
			connMutex.RUnlock()

			if !stillConnected {
				room.RemovePlayer(playerID)
				broadcastStateToRoom(room)
			}
		}()
	}()

	for {
		var action map[string]interface{}
		if err := conn.ReadJSON(&action); err != nil {
			break
		}

		actionType, ok := action["type"].(string)
		if !ok {
			continue
		}

		// Check host status under a read lock before evaluating any action.
		room.Mu.RLock()
		isHost := false
		if p, exists := room.Players[playerID]; exists && p.IsHost {
			isHost = true
		}
		room.Mu.RUnlock()

		switch actionType {
		case "LEAVE_ROOM":
			room.RemovePlayer(playerID)
			broadcastStateToRoom(room)
			return // defer handles WS teardown

		case "CLOSE_ROOM":
			if !isHost {
				continue
			}
			engine.Manager.RemoveRoom(room.ID)

			// Snapshot connections before releasing the lock
			connMutex.RLock()
			conns := roomClients[room.ID]
			activeConns := make([]*websocket.Conn, 0, len(conns))
			for _, c := range conns {
				activeConns = append(activeConns, c)
			}
			connMutex.RUnlock()

			for _, c := range activeConns {
				c.WriteJSON(gin.H{"error": "Room closed by host."})
				c.Close()
			}
			return

		case "START":
			if !isHost {
				continue
			}
			var wp models.WordPair
			if err := db.DB.Order("RANDOM()").First(&wp).Error; err != nil {
				wp = models.WordPair{WordA: "Burger", WordB: "Pizza"}
			}
			if err := room.StartGame(wp.WordA, wp.WordB); err != nil {
				conn.WriteJSON(gin.H{"error": err.Error()})
				continue
			}

		case "MARK_READY":
			room.MarkReady(playerID)

		case "CONTINUE_DISCUSSION":
			if !isHost {
				continue
			}
			room.AdvanceToDiscussion()

		case "PROGRESS_VOTING":
			if !isHost {
				continue
			}
			room.TransitionToVoting()

		case "CAST_VOTE":
			targetId, _ := action["targetId"].(string)
			room.RegisterVote(playerID, targetId)

			room.Mu.RLock()
			winner := room.Winner
			totalPlayers := len(room.Players)
			roomID := room.ID
			room.Mu.RUnlock()

			if winner == "CREW" || winner == "IMPOSTER" {
				res := models.MatchResult{
					RoomCode:     roomID,
					Winner:       winner,
					TotalPlayers: totalPlayers,
					ImposterWon:  winner == "IMPOSTER",
				}
				go func(r models.MatchResult) { db.DB.Create(&r) }(res)
			}

		case "ADD_LOCAL_PLAYER":
			if room.IsSingleDevice {
				if !isHost {
					continue
				}
				newId, _ := action["id"].(string)
				newName, _ := action["name"].(string)
				if newId != "" && newName != "" && len(newName) <= 30 {
					room.AddPlayer(newId, newName)
				}
			}

		case "FORCE_ELIMINATE":
			if room.IsSingleDevice {
				if !isHost {
					continue
				}
				targetId, _ := action["targetId"].(string)
				room.ForceEliminate(targetId)

				// Log FORCE_ELIMINATE match results (was previously missing)
				room.Mu.RLock()
				winner := room.Winner
				totalPlayers := len(room.Players)
				roomID := room.ID
				room.Mu.RUnlock()

				if winner == "CREW" || winner == "IMPOSTER" {
					res := models.MatchResult{
						RoomCode:     roomID,
						Winner:       winner,
						TotalPlayers: totalPlayers,
						ImposterWon:  winner == "IMPOSTER",
					}
					go func(r models.MatchResult) { db.DB.Create(&r) }(res)
				}
			}

		case "NEXT_ROUND":
			if !isHost {
				continue
			}
			room.ResetForNextRound()
		}

		broadcastStateToRoom(room)
	}
}

func mapRoomState(room *engine.Room, connectionPlayerID string) map[string]interface{} {
	room.Mu.RLock()
	defer room.Mu.RUnlock()

	playersExport := make(map[string]interface{})

	for id, p := range room.Players {
		pub := map[string]interface{}{
			"id":       p.ID,
			"name":     p.Name,
			"isHost":   p.IsHost,
			"isDead":   p.IsDead,
			"hasVoted": p.HasVoted,
			"score":    p.Score,
			"isReady":  p.IsReady,
			"order":    p.Order,
		}

		// Only reveal secret info to the owning player, or when the round ends,
		// or in single-device mode where everyone shares the same screen.
		if id == connectionPlayerID || room.Phase == engine.PhaseResults || room.IsSingleDevice {
			pub["Word"] = p.Word
			pub["IsImposter"] = p.IsImposter
		}
		playersExport[id] = pub
	}

	return map[string]interface{}{
		"ID":             room.ID,
		"IsSingleDevice": room.IsSingleDevice,
		"IsPrivate":      room.IsPrivate,
		"Phase":          room.Phase,
		"Winner":         room.Winner,
		"LastEliminated": room.LastEliminated,
		"Players":        playersExport,
	}
}

func broadcastStateToRoom(room *engine.Room) {
	connMutex.RLock()
	conns, exists := roomClients[room.ID]

	if !exists {
		connMutex.RUnlock()
		return
	}

	// Snapshot the connection map while the read lock is still held.
	// Releasing the lock before iterating would allow concurrent writes to
	// the inner map, triggering a fatal "concurrent map iteration and map write".
	activeConns := make(map[string]*websocket.Conn, len(conns))
	for pid, conn := range conns {
		activeConns[pid] = conn
	}
	connMutex.RUnlock()

	// Now it is safe to iterate our isolated copy without holding any lock.
	for pid, conn := range activeConns {
		conn.SetWriteDeadline(time.Now().Add(writeWait))
		payload := mapRoomState(room, pid)
		if err := conn.WriteJSON(gin.H{"type": "ROOM_STATE", "payload": payload}); err != nil {
			conn.Close()
		}
	}
}
