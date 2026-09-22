package handlers

import (
	"net/http"

	"imposter-backend/engine"
	"github.com/gin-gonic/gin"
)

// CreateRoomRequest maps the exact payload sent by Next.js
type CreateRoomRequest struct {
	IsPrivate      bool `json:"isPrivate"`
	IsSingleDevice bool `json:"isSingleDevice"`
}

// HandleCreateRoom exposes the Engine generation natively to HTTP
func HandleCreateRoom(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parsing schema"})
		return
	}

	// 100% thread-safe Room instantiation
	room := engine.Manager.CreateRoom(req.IsPrivate, req.IsSingleDevice)
	
	c.JSON(http.StatusOK, gin.H{
		"roomId": room.ID,
	})
}

// HandleGetPublicRooms securely polls the engine memory for open joinable lobbies
func HandleGetPublicRooms(c *gin.Context) {
	rooms := engine.Manager.GetPublicRooms()
	
	// Prevents json from returning `null` if the array resolves empty natively
	if rooms == nil {
		rooms = []map[string]interface{}{}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"rooms": rooms,
	})
}
