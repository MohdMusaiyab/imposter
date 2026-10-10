package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"
)

type TokenClaims struct {
	PlayerID string
	RoomID   string
	IsHost   bool
}

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-in-production"
	}
	return []byte(secret)
}

func IssueToken(playerID, roomID string, isHost bool) string {
	isHostStr := "0"
	if isHost {
		isHostStr = "1"
	}
	expiry := fmt.Sprintf("%d", time.Now().Add(24*time.Hour).Unix())
	payload := strings.Join([]string{playerID, roomID, isHostStr, expiry}, ":")

	mac := hmac.New(sha256.New, jwtSecret())
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))

	return payload + "." + sig
}

func VerifyToken(token string) (*TokenClaims, error) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return nil, errors.New("malformed token")
	}

	payload, sig := parts[0], parts[1]

	mac := hmac.New(sha256.New, jwtSecret())
	mac.Write([]byte(payload))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
		return nil, errors.New("invalid token signature")
	}

	fields := strings.Split(payload, ":")
	if len(fields) != 4 {
		return nil, errors.New("malformed token payload")
	}

	playerID, roomID, isHostStr := fields[0], fields[1], fields[2]
	var expiry int64
	fmt.Sscanf(fields[3], "%d", &expiry)

	if time.Now().Unix() > expiry {
		return nil, errors.New("token has expired")
	}

	return &TokenClaims{
		PlayerID: playerID,
		RoomID:   roomID,
		IsHost:   isHostStr == "1",
	}, nil
}
