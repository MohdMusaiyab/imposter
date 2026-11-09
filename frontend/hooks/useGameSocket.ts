import { useState, useEffect, useCallback, useRef } from "react";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isDead: boolean;
  hasVoted: boolean;
  score: number;
  isReady: boolean;
  order: number;
  isConnected?: boolean;
  Word?: string;
  IsImposter?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
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
  ActiveCategories?: string[];
  CurrentCategory?: string;
  ChatMessages?: ChatMessage[];
}

export function useGameSocket(roomId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    let manualClose = false;

    const connect = () => {
      const sessionStr = localStorage.getItem("imposter_session");
      if (!sessionStr) {
        if (isMounted)
          setError(
            "No valid game session found. Please return to the homepage.",
          );
        return;
      }

      const session = JSON.parse(sessionStr);

      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname.startsWith("192.168.");
      const wsBaseUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        (isLocal
          ? `ws://${window.location.hostname}:9999`
          : "wss://imposter-54yr.onrender.com");

      const wsUrl = `${wsBaseUrl}/ws/room/${roomId}?token=${session.token}&playerName=${encodeURIComponent(session.name)}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
          return;
        }
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "KICKED") {
            manualClose = true;
            setError(data.error || "You have been kicked by the host.");
            localStorage.removeItem("imposter_session");
            ws.close();
            return;
          }

          if (data.error) {
            setError(data.error);
            return;
          }

          if (data.type === "ROOM_STATE") {
            setGameState(data.payload);
          } else if (data.ID) {
            setGameState(data);
          }
        } catch (err) {
          console.error("Failed to parse websocket pipeline:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket network error:", err);
      };

      ws.onclose = () => {
        if (!isMounted || manualClose) return;
        setIsConnected(false);
        setIsReconnecting(true);

        const baseDelay = 1000;
        const maxDelay = 10000;
        const backoffDelay = Math.min(
          baseDelay * Math.pow(1.5, reconnectAttempts.current),
          maxDelay,
        );
        const jitter = Math.floor(Math.random() * 400);
        const nextAttemptMs = backoffDelay + jitter;

        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connect();
        }, nextAttemptMs);
      };
    };

    connect();

    const handleWake = () => {
      if (!isMounted || manualClose) return;
      if (
        !socketRef.current ||
        socketRef.current.readyState === WebSocket.CLOSED ||
        socketRef.current.readyState === WebSocket.CLOSING
      ) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectAttempts.current = 0;
        connect();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleWake();
      }
    };

    window.addEventListener("online", handleWake);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      manualClose = true;
      window.removeEventListener("online", handleWake);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, [roomId]);

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

  return { gameState, isConnected, isReconnecting, error, sendAction };
}
