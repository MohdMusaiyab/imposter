package handlers

import (
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
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
	pongWait     = 20 * time.Second
	writeWait    = 10 * time.Second
)

type SafeConn struct {
	*websocket.Conn
	mu sync.Mutex
}

func (s *SafeConn) SafeWriteJSON(v interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.SetWriteDeadline(time.Now().Add(writeWait))
	return s.WriteJSON(v)
}

func (s *SafeConn) SafeWritePing() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.SetWriteDeadline(time.Now().Add(writeWait))
	return s.WriteMessage(websocket.PingMessage, nil)
}

func (s *SafeConn) SafeClose() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.Close()
}

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
	roomClients = make(map[string]map[string]*SafeConn)
	connMutex   = sync.RWMutex{}

	matchRecordWorker = make(chan models.MatchResult, 100)
)

func init() {
	go func() {
		for res := range matchRecordWorker {
			if db.DB != nil {
				db.DB.Create(&res)
			}
		}
	}()
}

func ServeWS(c *gin.Context) {
	roomID := c.Param("roomId")
	rawToken := c.Query("token")
	playerName := c.Query("playerName")

	if rawToken == "" || playerName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing player credentials or token"})
		return
	}

	claims, err := VerifyToken(rawToken)
	if err != nil || claims.RoomID != roomID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	playerID := claims.PlayerID

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
	conn.SetReadLimit(4096)
	safeConn := &SafeConn{Conn: conn}

	if err := room.AddPlayer(playerID, playerName); err != nil {
		safeConn.SafeWriteJSON(gin.H{"error": err.Error()})
		safeConn.SafeClose()
		return
	}

	connMutex.Lock()
	if roomClients[roomID] == nil {
		roomClients[roomID] = make(map[string]*SafeConn)
	}
	roomClients[roomID][playerID] = safeConn
	connMutex.Unlock()

	broadcastStateToRoom(room)

	go readPump(safeConn, room, playerID)
	go writePump(safeConn, room, playerID)
}

func writePump(conn *SafeConn, room *engine.Room, playerID string) {
	ticker := time.NewTicker(pingInterval)
	defer ticker.Stop()

	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	conn.SetReadDeadline(time.Now().Add(pongWait))

	for {
		<-ticker.C

		connMutex.RLock()
		currentConn, active := roomClients[room.ID][playerID]
		connMutex.RUnlock()
		if !active || currentConn != conn {
			return
		}

		if err := conn.SafeWritePing(); err != nil {
			return
		}
	}
}

func parseCategoriesFromAction(action map[string]interface{}) ([]string, bool) {
	var rawCats []interface{}
	found := false

	if cats, ok := action["categories"].([]interface{}); ok {
		rawCats = cats
		found = true
	} else if payload, ok := action["payload"].(map[string]interface{}); ok {
		if cats, ok := payload["categories"].([]interface{}); ok {
			rawCats = cats
			found = true
		}
	}

	if !found {
		return nil, false
	}

	validCats := make([]string, 0)
	for _, c := range rawCats {
		if cs, ok := c.(string); ok && models.IsValidCategory(cs) {
			validCats = append(validCats, cs)
		}
	}
	return validCats, true
}

func parseImposterCountFromAction(action map[string]interface{}) int {
	if ic, ok := action["imposterCount"].(float64); ok {
		return int(ic)
	}
	if payload, ok := action["payload"].(map[string]interface{}); ok {
		if ic, ok := payload["imposterCount"].(float64); ok {
			return int(ic)
		}
	}
	return 0
}

func parsePlayerIDsFromAction(action map[string]interface{}) []string {
	var rawIDs []interface{}
	if ids, ok := action["playerIds"].([]interface{}); ok {
		rawIDs = ids
	} else if payload, ok := action["payload"].(map[string]interface{}); ok {
		if ids, ok := payload["playerIds"].([]interface{}); ok {
			rawIDs = ids
		}
	}
	if len(rawIDs) == 0 {
		return nil
	}
	res := make([]string, 0, len(rawIDs))
	for _, id := range rawIDs {
		if sid, ok := id.(string); ok && sid != "" {
			res = append(res, sid)
		}
	}
	return res
}

func readPump(conn *SafeConn, room *engine.Room, playerID string) {
	defer func() {
		connMutex.Lock()
		isStillActiveSocket := false
		if roomClients[room.ID] != nil && roomClients[room.ID][playerID] == conn {
			delete(roomClients[room.ID], playerID)
			if len(roomClients[room.ID]) == 0 {
				delete(roomClients, room.ID)
			}
		} else if roomClients[room.ID] != nil && roomClients[room.ID][playerID] != nil {
			isStillActiveSocket = true
		}
		connMutex.Unlock()
		conn.SafeClose()

		if !isStillActiveSocket {
			room.SetPlayerConnected(playerID, false)
			broadcastStateToRoom(room)

			if _, err := engine.Manager.GetRoom(room.ID); err == nil {
				go func(expectedConn *SafeConn) {
					time.Sleep(75 * time.Second)
					connMutex.RLock()
					currentConn, stillConnected := roomClients[room.ID][playerID]
					connMutex.RUnlock()

					if !stillConnected || currentConn == expectedConn {
						room.RemovePlayer(playerID)
						broadcastStateToRoom(room)
					}
				}(conn)
			}
		}
	}()

	rateLimitWindow := time.Now()
	messageCount := 0
	const maxMessages = 40
	const windowDuration = 10 * time.Second

	for {
		now := time.Now()
		if now.Sub(rateLimitWindow) > windowDuration {
			rateLimitWindow = now
			messageCount = 0
		}
		messageCount++
		if messageCount > maxMessages {
			log.Printf("Rate limit exceeded for player %s in room %s", playerID, room.ID)
			break
		}

		var action map[string]interface{}
		if err := conn.ReadJSON(&action); err != nil {
			break
		}

		actionType, ok := action["type"].(string)
		if !ok {
			continue
		}

		room.Mu.RLock()
		isHost := room.IsSingleDevice
		if p, exists := room.Players[playerID]; exists && p.IsHost {
			isHost = true
		}
		room.Mu.RUnlock()

		switch actionType {
		case "LEAVE_ROOM":
			room.RemovePlayer(playerID)
			broadcastStateToRoom(room)
			return

		case "CLOSE_ROOM":
			if !isHost {
				continue
			}
			engine.Manager.RemoveRoom(room.ID)

			connMutex.RLock()
			conns := roomClients[room.ID]
			activeConns := make([]*SafeConn, 0, len(conns))
			for _, c := range conns {
				activeConns = append(activeConns, c)
			}
			connMutex.RUnlock()

			for _, c := range activeConns {
				c.SafeWriteJSON(gin.H{"error": "Room closed by host."})
				c.SafeClose()
			}
			return

		case "KICK_PLAYER":
			if !isHost {
				continue
			}
			targetId, _ := action["targetId"].(string)
			if targetId == "" {
				if payload, ok := action["payload"].(map[string]interface{}); ok {
					targetId, _ = payload["targetId"].(string)
				}
			}
			if err := room.KickPlayer(playerID, targetId); err != nil {
				continue
			}
			connMutex.Lock()
			if targetConn, exists := roomClients[room.ID][targetId]; exists {
				targetConn.SafeWriteJSON(gin.H{"type": "KICKED", "error": "You have been kicked by the host."})
				targetConn.SafeClose()
				delete(roomClients[room.ID], targetId)
			}
			connMutex.Unlock()
			broadcastStateToRoom(room)
			continue

		case "START":
			if !isHost {
				continue
			}

			customImposters := parseImposterCountFromAction(action)
			if validCats, ok := parseCategoriesFromAction(action); ok {
				room.Mu.Lock()
				room.ActiveCategories = validCats
				room.Mu.Unlock()
			}

			room.Mu.RLock()
			activeCats := make([]string, len(room.ActiveCategories))
			copy(activeCats, room.ActiveCategories)
			room.Mu.RUnlock()

			query := db.DB.Model(&models.WordPair{})
			if len(activeCats) > 0 {
				query = query.Where("category IN (?)", activeCats)
			}

			var allIDs []uint
			if err := query.Pluck("id", &allIDs).Error; err != nil {
				log.Printf("Failed to load word pairs: %v", err)
			}

			var availableIDs []uint
			room.Mu.RLock()
			usedMap := make(map[uint]bool)
			for _, uID := range room.UsedWords {
				usedMap[uID] = true
			}
			room.Mu.RUnlock()

			for _, id := range allIDs {
				if !usedMap[id] {
					availableIDs = append(availableIDs, id)
				}
			}

			var wp models.WordPair
			if len(availableIDs) == 0 {
				if len(allIDs) > 0 {
					selectedID := allIDs[rand.Intn(len(allIDs))]
					_ = db.DB.First(&wp, selectedID).Error
				}
				if wp.WordA == "" {
					wp = models.WordPair{WordA: "Burger", WordB: "Pizza", Category: models.CategoryFoodDrink}
				}
			} else {
				selectedID := availableIDs[rand.Intn(len(availableIDs))]
				if err := db.DB.First(&wp, selectedID).Error; err != nil {
					wp = models.WordPair{WordA: "Burger", WordB: "Pizza", Category: models.CategoryFoodDrink}
				} else {
					room.Mu.Lock()
					room.UsedWords = append(room.UsedWords, selectedID)
					room.Mu.Unlock()
				}
			}

			room.Mu.Lock()
			room.CurrentCategory = string(wp.Category)
			room.Mu.Unlock()

			if err := room.StartGame(wp.WordA, wp.WordB, customImposters); err != nil {
				conn.SafeWriteJSON(gin.H{"error": err.Error()})
				continue
			}

		case "MARK_READY":
			room.MarkReady(playerID)

		case "FORCE_START_DISCUSSION":
			if !isHost {
				continue
			}
			if err := room.ForceAdvanceReveal(playerID); err != nil {
				continue
			}

		case "FORCE_TALLY_VOTES":
			if !isHost {
				continue
			}
			if err := room.ForceTallyVotes(playerID); err != nil {
				continue
			}

		case "ABORT_TO_LOBBY":
			if !isHost {
				continue
			}
			if err := room.AbortToLobby(playerID); err != nil {
				continue
			}

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
				select {
				case matchRecordWorker <- res:
				default:
					log.Println("Match worker queue full, dropping record")
				}
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
					select {
					case matchRecordWorker <- res:
					default:
						log.Println("Match worker queue full, dropping record")
					}
				}
			}

		case "NEXT_ROUND":
			if !isHost {
				continue
			}
			room.ResetForNextRound()

		case "UPDATE_CATEGORIES":
			if !isHost {
				continue
			}
			if validCats, ok := parseCategoriesFromAction(action); ok {
				room.Mu.Lock()
				room.ActiveCategories = validCats
				room.Mu.Unlock()
			}

		case "REORDER_PLAYERS":
			if !isHost {
				continue
			}
			if orderedIDs := parsePlayerIDsFromAction(action); len(orderedIDs) > 0 {
				room.ReorderPlayers(orderedIDs)
			}

		case "SEND_CHAT":
			if room.IsSingleDevice {
				continue
			}
			rawText, _ := action["text"].(string)
			if rawText == "" {
				if payload, ok := action["payload"].(map[string]interface{}); ok {
					rawText, _ = payload["text"].(string)
				}
			}
			text := strings.TrimSpace(rawText)
			if text == "" {
				continue
			}
			runes := []rune(text)
			if len(runes) > 200 {
				text = string(runes[:200])
			}
			if _, err := room.AddChatMessage(playerID, text); err != nil {
				continue
			}
		}

		broadcastStateToRoom(room)
	}
}

func mapRoomState(room *engine.Room, connectionPlayerID string) map[string]interface{} {
	room.Mu.RLock()
	defer room.Mu.RUnlock()

	playersExport := make(map[string]interface{})
	isGameOver := room.Winner == "CREW" || room.Winner == "IMPOSTER"

	for id, p := range room.Players {
		pub := map[string]interface{}{
			"id":          p.ID,
			"name":        p.Name,
			"isHost":      p.IsHost,
			"isDead":      p.IsDead,
			"hasVoted":    p.HasVoted,
			"score":       p.Score,
			"isReady":     p.IsReady,
			"order":       p.Order,
			"isConnected": p.IsConnected,
		}

		if id == connectionPlayerID || room.IsSingleDevice || isGameOver {
			pub["Word"] = p.Word
			pub["IsImposter"] = p.IsImposter
		} else if room.Phase == engine.PhaseResults && p.IsDead {
			pub["IsImposter"] = p.IsImposter
		}
		playersExport[id] = pub
	}

	chats := room.ChatMessages
	if chats == nil {
		chats = []engine.ChatMessage{}
	}

	return map[string]interface{}{
		"ID":               room.ID,
		"IsSingleDevice":   room.IsSingleDevice,
		"IsPrivate":        room.IsPrivate,
		"Phase":            room.Phase,
		"Winner":           room.Winner,
		"LastEliminated":   room.LastEliminated,
		"ActiveCategories": room.ActiveCategories,
		"CurrentCategory":  room.CurrentCategory,
		"Players":          playersExport,
		"ChatMessages":     chats,
	}
}

func broadcastStateToRoom(room *engine.Room) {
	connMutex.RLock()
	conns, exists := roomClients[room.ID]

	if !exists {
		connMutex.RUnlock()
		return
	}

	activeConns := make(map[string]*SafeConn, len(conns))
	for pid, conn := range conns {
		activeConns[pid] = conn
	}
	connMutex.RUnlock()

	for pid, conn := range activeConns {
		payload := mapRoomState(room, pid)
		if err := conn.SafeWriteJSON(gin.H{"type": "ROOM_STATE", "payload": payload}); err != nil {
			conn.SafeClose()
		}
	}
}
