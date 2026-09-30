package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"imposter-backend/engine"
)

type CreateRoomRequest struct {
	IsPrivate      bool `json:"isPrivate"`
	IsSingleDevice bool `json:"isSingleDevice"`
}

func HandleCreateRoom(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parsing schema"})
		return
	}

	room := engine.Manager.CreateRoom(req.IsPrivate, req.IsSingleDevice)

	c.JSON(http.StatusOK, gin.H{
		"roomId": room.ID,
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
