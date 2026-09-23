import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Defining exact UI interfaces that map back to the Go Engine struct
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isDead: boolean;
  hasVoted: boolean;
  score: number;
  isReady: boolean;
  order: number;
  // Word and IsImposter are conditionally present — only the owning player
  // (or everyone in Results / SingleDevice mode) receives these fields.
  Word?: string;
  IsImposter?: boolean;
}

export interface GameState {
  ID: string;
  IsSingleDevice: boolean;
  IsPrivate: boolean;
  Phase: "LOBBY" | "REVEAL" | "DISCUSSION" | "VOTING" | "RESULTS";
  LastEliminated: string;
  Winner: string;
  Players: Record<string, Player>;
}

// Validates the locally-stored session object has all required fields.
// A missing/corrupted session (e.g. partial LocalStorage clear) used to throw
// an unhandled exception that crashed the entire component tree silently.
function parseSession(raw: string | null): { playerId: string; name: string } | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (
      typeof s.playerId === 'string' && s.playerId.trim() !== '' &&
      typeof s.name === 'string' && s.name.trim() !== ''
    ) {
      return { playerId: s.playerId, name: s.name };
    }
    return null;
  } catch {
    return null;
  }
}

export function useGameSocket(roomId: string | null) {
  // Validate session synchronously before any effect runs.
  // This avoids calling setState() inside useEffect (React anti-pattern)
  // which causes an extra cascading render cycle on every mount.
  const session = useMemo(
    () => parseSession(localStorage.getItem("imposter_session")),
    []
  );

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(
    // Seed the error state immediately if session is invalid.
    // No effect needed — this is a synchronous initial value.
    !session ? "No valid game session found. Please return to the homepage and try again." : null
  );
  const [isConnected, setIsConnected] = useState(false);

  // Hold the active connection to prevent memory leaks on unmount
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // If there's no valid session there's nothing to connect — error is
    // already seeded above as the initial useState value.
    if (!roomId || !session) return;

    const wsUrl = `ws://localhost:9999/ws/room/${roomId}?playerId=${session.playerId}&playerName=${encodeURIComponent(session.name)}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.type === "ROOM_STATE") {
          setGameState(data.payload);
        } else if (data.ID) {
          // Fallback if the server pushes the root object directly
          setGameState(data);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection failed. Is the Go backend running?");
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    // Safely close the connection when the component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [roomId, session]);

  const sendAction = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn("Attempted to send action but socket is not open.");
    }
  }, []);

  return { gameState, isConnected, error, sendAction };
}
