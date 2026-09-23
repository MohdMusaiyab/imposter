import { useState, useEffect, useCallback, useRef } from 'react';

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

  useEffect(() => {
    if (!roomId) return;

    // 1. Retrieve the localized credentials securely 
    const sessionStr = localStorage.getItem("imposter_session");
    if (!sessionStr) {
      setError("No valid game session found. Please return to the homepage.");
      return;
    }

    const session = JSON.parse(sessionStr);
    
    // 2. Safely initiate duplex connection to Go Engine 
    const wsUrl = `ws://localhost:9999/ws/room/${roomId}?playerId=${session.playerId}&playerName=${encodeURIComponent(session.name)}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
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
        } else if (data.ID) { // Fallback if pushed root object
          setGameState(data);
        }
      } catch (err) {
        console.error("Failed to parse websocket pipeline:", err);
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection failed entirely. Is the Go backend running?");
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    // 4. Safely wipe connection on component unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [roomId]);

  // 5. Expose an actionable pipeline for UI components to broadcast to Go
  const sendAction = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn("Attempted to send action but socket engine is inactive.");
    }
  }, []);

  return { gameState, isConnected, error, sendAction };
}
