package main

import (
	"log"
	"net/http"
	"os"

	"imposter-backend/db"
	"imposter-backend/engine"
	"imposter-backend/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// CORSMiddleware authorizes cross-origin fetch protocols naturally
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = "http://localhost:3001" // Default fallback
		}
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func main() {
	_ = godotenv.Load()

	if err := db.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Start the background goroutine that evicts idle/empty rooms every 10 min.
	// Without this, abandoned lobbies accumulate in memory indefinitely.
	engine.Manager.StartCleanup()
	r := gin.Default()
	r.Use(CORSMiddleware())

	r.GET("/health", func(c *gin.Context) {
		sqlDB, err := db.DB.DB()
		if err != nil || sqlDB.Ping() != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "Database unreachable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "OK"})
	})

	r.POST("/api/rooms", handlers.HandleCreateRoom)
	r.GET("/api/rooms/public", handlers.HandleGetPublicRooms)
	r.GET("/ws/room/:roomId", handlers.ServeWS)
	port := os.Getenv("PORT")
	if port == "" {
		port = "9999" // Safely moved off 8080 to prevent standard collisions
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
