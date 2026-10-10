package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"imposter-backend/engine"
)

type CreateRoomRequest struct {
	PlayerID       string `json:"playerId"`
	IsPrivate      bool   `json:"isPrivate"`
	IsSingleDevice bool   `json:"isSingleDevice"`
}

func HandleCreateRoom(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parsing schema"})
		return
	}

	room := engine.Manager.CreateRoom(req.IsPrivate, req.IsSingleDevice)
	token := IssueToken(req.PlayerID, room.ID, true)

	c.JSON(http.StatusOK, gin.H{
		"roomId": room.ID,
		"token":  token,
	})
}

type JoinRoomRequest struct {
	RoomCode string `json:"roomCode"`
	PlayerID string `json:"playerId"`
}

func HandleJoinRoom(c *gin.Context) {
	var req JoinRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parsing schema"})
		return
	}

	room, err := engine.Manager.GetRoom(req.RoomCode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found or expired"})
		return
	}

	token := IssueToken(req.PlayerID, room.ID, false)

	c.JSON(http.StatusOK, gin.H{
		"roomId": room.ID,
		"token":  token,
	})
}

func HandleGetPublicRooms(c *gin.Context) {
	rooms := engine.Manager.GetPublicRooms()

	if rooms == nil {
		rooms = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, gin.H{
		"rooms": rooms,
	})
}
