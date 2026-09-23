import { useState, useEffect, useCallback, useRef } from "react";

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
  ImposterWord: string;
  CrewWord: string;
}

export function useGameSocket(roomId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Natively holding the active connection to prevent memory leaks
  const socketRef = useRef<WebSocket | null>(null);

  // Track attempts to accurately space out exponential backoff spikes
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;

    // Wrap the pipeline in a functional block to allow recursive backoff loops
    const connect = () => {
      // 1. Retrieve the localized credentials securely
      const sessionStr = localStorage.getItem("imposter_session");
      if (!sessionStr) {
        if (isMounted) setError("No valid game session found. Please return to the homepage.");
        return;
      }

      const session = JSON.parse(sessionStr);

      // 2. Safely initiate duplex connection to Go Engine
      // If NEXT_PUBLIC_BACKEND_WS_URL is set (e.g. wss://imposter.onrender.com), use that.
      // If empty (local dev), dynamically infer the host address via window.location.
      const wsBaseUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || `ws://${window.location.hostname}:9999`;
      
      const wsUrl = `${wsBaseUrl}/ws/room/${roomId}?playerId=${session.playerId}&playerName=${encodeURIComponent(session.name)}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
          return;
        }
        setIsConnected(true);
        setError(null);
        // Reset the exponential backoff counter upon a healthy connection!
        reconnectAttempts.current = 0;
      };

      // 3. Listen to all background syncs pushed by Go natively
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setError(data.error);
            return;
          }

          // Accurately map the struct over depending on how the handler bundled it
          if (data.type === "ROOM_STATE") {
            setGameState(data.payload);
          } else if (data.ID) {
            // Fallback if pushed root object
            setGameState(data);
          }
        } catch (err) {
          console.error("Failed to parse websocket pipeline:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket network error:", err);
        // We do NOT set state here because standard architecture dictates
        // that 'onclose' will strictly fire immediately after this.
        // Handling reconnect logic in onclose prevents double-firing.
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
        setError("Connection lost. Reconnecting to game server...");

        // Exponential Backoff with random Jitter
        // This prevents the "Thundering Herd" problem where 20 players all
        // attempt to reconnect at the exact same millisecond and crash the Go server.
        const baseDelay = 1000; // Start with 1 second delay
        const maxDelay = 15000; // Cap at 15 seconds
        
        // Calculate standard exponential time (1s, 2s, 4s, 8s, 15s)
        const backoffDelay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), maxDelay);
        // Inject 0-500ms of random jitter
        const jitter = Math.floor(Math.random() * 500); 
        
        const nextAttemptMs = backoffDelay + jitter;
        
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connect();
        }, nextAttemptMs);
      };
    };

    // Ignite the engine!
    connect();

    // 4. Safely wipe connection and backoff timers on component unmount
    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, [roomId]);

  // 5. Expose an actionable pipeline for UI components to broadcast to Go
  const sendAction = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(JSON.stringify({ type, ...payload }));
      } else {
        console.warn("Attempted to send action but socket engine is inactive.");
      }
    },
    [],
  );

  return { gameState, isConnected, error, sendAction };
}
