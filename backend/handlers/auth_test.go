package handlers_test

import (
	"strings"
	"testing"

	"imposter-backend/handlers"
)

func TestTokenIssueAndVerify(t *testing.T) {
	token := handlers.IssueToken("player-123", "ROOM1", true)
	claims, err := handlers.VerifyToken(token)
	if err != nil {
		t.Fatalf("failed to verify valid token: %v", err)
	}
	if claims.PlayerID != "player-123" {
		t.Errorf("expected PlayerID player-123, got %s", claims.PlayerID)
	}
	if claims.RoomID != "ROOM1" {
		t.Errorf("expected RoomID ROOM1, got %s", claims.RoomID)
	}
	if !claims.IsHost {
		t.Error("expected IsHost to be true")
	}
}

func TestTokenDelimiterSanitization(t *testing.T) {
	injectedID := "attacker:ROOM2:1:9999999999"
	token := handlers.IssueToken(injectedID, "ROOM2", false)

	claims, err := handlers.VerifyToken(token)
	if err != nil {
		t.Fatalf("expected sanitized token to verify cleanly, got err: %v", err)
	}

	if strings.Contains(claims.PlayerID, ":") {
		t.Errorf("player ID must not retain raw colon delimiters: %s", claims.PlayerID)
	}

	if claims.IsHost {
		t.Error("injected isHost payload must not grant host privileges")
	}
}

func TestTokenTamperDetection(t *testing.T) {
	token := handlers.IssueToken("player-1", "ROOM1", false)
	tampered := strings.Replace(token, ":0:", ":1:", 1)

	_, err := handlers.VerifyToken(tampered)
	if err == nil {
		t.Error("expected tampered token signature check to fail")
	}
}
