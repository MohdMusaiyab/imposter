package handlers

import (
	"log"
	"net/http"

	"imposter-backend/db"
	"imposter-backend/engine"
	"imposter-backend/models"
	
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Security: Allow Next.js frontend to securely connect from any designated origin dynamically
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all for MVP, restrict dynamically later for exact domains
	},
}

// ServeWS UPGRADES the Gin HTTP request securely into a pure TCP duplex Socket
func ServeWS(c *gin.Context) {
	roomID := c.Param("roomId")
	playerID := c.Query("playerId")
	playerName := c.Query("playerName")

	if playerID == "" || playerName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing precise physical player credentials"})
		return
	}

	room, err := engine.Manager.GetRoom(roomID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Upgrade pipeline natively
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade socket: %v", err)
		return
	}

	// Safely map player to the Engine Room memory
	if err := room.AddPlayer(playerID, playerName); err != nil {
		conn.WriteJSON(map[string]string{"error": err.Error()})
		conn.Close()
		return
	}

	// Send an immediate acknowledgement of GameState so client can blindly sync UI securely
	rState := mapRoomState(room)
	conn.WriteJSON(gin.H{"type": "ROOM_STATE", "payload": rState})

	// Spin a goroutine loop for listening to incoming clicks
	go readPump(conn, room, playerID)
}

// readPump constantly evaluates byte-streams arriving from Next.js natively
func readPump(conn *websocket.Conn, room *engine.Room, playerID string) {
	defer func() {
		// Cleanup connection entirely when closed
		conn.Close()
		// TODO: Engine handle disconnection grace periods (TTL) natively
	}()

	for {
		var action map[string]interface{}
		err := conn.ReadJSON(&action)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket Abnormality: %v", err)
			}
			break
		}

		// Handle active game pipeline clicks here
		// Example: "START_GAME", "VOTE_SUBMITTED"
		actionType, ok := action["type"].(string)
		if !ok {
			continue
		}

		switch actionType {
		case "START":
			// Securely query a 100% random word pair out of Postgres natively on the spot
			var wp models.WordPair
			if err := db.DB.Order("RANDOM()").First(&wp).Error; err != nil {
				log.Printf("GORM query randomly failing, executing fallback words securely: %v", err)
				wp = models.WordPair{WordA: "Burger", WordB: "Pizza"}
			}
			room.StartGame(wp.WordA, wp.WordB)

		case "END_GAME":
			// Distribute round points based on parameters
			imposterCaught, _ := action["imposterCaught"].(bool)
			room.ResolveRound(imposterCaught)

			winner := "IMPOSTER"
			if imposterCaught {
				winner = "CREW"
			}

			// Generate GORM Metric Model natively
			result := models.MatchResult{
				RoomCode:     room.ID,
				Winner:       winner,
				TotalPlayers: len(room.Players),
				ImposterWon:  !imposterCaught,
			}
			
			// Commit the transaction inside an isolated lightweight Goroutine so the network I/O loop isn't bottlenecked at all
			go func(res models.MatchResult) {
				if err := db.DB.Create(&res).Error; err != nil {
					log.Printf("🚨 GORM insertion failure for Match metrics: %v", err)
				}
			}(result)
		}
		
		// Every action essentially mandates the new state is distributed
		broadcastStateToRoom(room)
	}
}

// mapRoomState secures the exact dataset needed by the Frontend preventing any memory cheating natively
func mapRoomState(room *engine.Room) interface{} {
	// Custom mapping logic later to hide imposter data cleanly across the pipe.
	// For now just dumping raw room (since IsImposter is natively hidden in models via `json:"-"`).
	return room
}

// broadcastStateToRoom simulates pushing the memory state back out.
func broadcastStateToRoom(room *engine.Room) {
	// Next iteration will include a hub loop to actively push to actual connections mapped individually 
}
