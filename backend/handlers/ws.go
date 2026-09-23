package handlers

import (
	"log"
	"net/http"
	"sync"
	"time"

	"imposter-backend/db"
	"imposter-backend/engine"
	"imposter-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
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
}

func readPump(conn *websocket.Conn, room *engine.Room, playerID string) {
	defer func() {
		connMutex.Lock()
		if roomClients[room.ID] != nil {
			delete(roomClients[room.ID], playerID)
		}
		connMutex.Unlock()
		conn.Close()

		go func() {
			time.Sleep(10 * time.Second)
			connMutex.RLock()
			stillConnected := false
			if roomClients[room.ID] != nil {
				_, stillConnected = roomClients[room.ID][playerID]
			}
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

		switch actionType {
		case "LEAVE_ROOM":
			room.RemovePlayer(playerID)
			broadcastStateToRoom(room)
			return // Exit cleanly; defer handles WS teardown

		case "CLOSE_ROOM":
			engine.Manager.RemoveRoom(room.ID)
			connMutex.RLock()
			conns := roomClients[room.ID]
			connMutex.RUnlock()
			for _, c := range conns {
				c.WriteJSON(gin.H{"error": "Room closed by host."})
				c.Close()
			}
			return

		case "START":
			var wp models.WordPair
			if err := db.DB.Order("RANDOM()").First(&wp).Error; err != nil {
				wp = models.WordPair{WordA: "Burger", WordB: "Pizza"}
			}
			room.StartGame(wp.WordA, wp.WordB)

		case "MARK_READY":
			room.MarkReady(playerID)

		case "CONTINUE_DISCUSSION":
			room.AdvanceToDiscussion()

		case "PROGRESS_VOTING":
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
				res := models.MatchResult{RoomCode: roomID, Winner: winner, TotalPlayers: totalPlayers, ImposterWon: winner == "IMPOSTER"}
				go func(r models.MatchResult) { db.DB.Create(&r) }(res)
			}
			
		case "ADD_LOCAL_PLAYER":
			if room.IsSingleDevice {
				newId, _ := action["id"].(string)
				newName, _ := action["name"].(string)
				if newId != "" && newName != "" {
					room.AddPlayer(newId, newName)
				}
			}
			
		case "FORCE_ELIMINATE":
			if room.IsSingleDevice {
				targetId, _ := action["targetId"].(string)
				room.ForceEliminate(targetId)
			}

		case "NEXT_ROUND":
			room.ResetForNextRound()
		}

		broadcastStateToRoom(room)
	}
}

func mapRoomState(room *engine.Room, connectionPlayerID string) map[string]interface{} {
	// Use exported Mu to safely read all fields
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

		// Only reveal secret info to the correct player (or in results/single-device)
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
	connMutex.RUnlock()

	if !exists {
		return
	}

	for pid, conn := range conns {
		payload := mapRoomState(room, pid)
		if err := conn.WriteJSON(gin.H{"type": "ROOM_STATE", "payload": payload}); err != nil {
			conn.Close()
		}
	}
}
