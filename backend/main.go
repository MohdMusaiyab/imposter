package main

import (
	"log"
	"net/http"
	"os"

	"imposter-backend/db"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	if err := db.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		sqlDB, err := db.DB.DB()
		if err != nil || sqlDB.Ping() != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "Database unreachable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "OK"})
	})
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
