"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameSocket } from "@/hooks/useGameSocket";
import type { GameState, Player } from "@/hooks/useGameSocket";
import Link from "next/link";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";
import CategorySelector from "@/app/components/CategorySelector";
import ChatDrawer from "@/app/components/ChatDrawer";
import { CATEGORIES, CategoryKey } from "@/types/categories";

const EMPTY_CATEGORIES: string[] = [];

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #16161a",
  boxShadow: "5px 6px 0 #e9e9ee",
  padding: "32px 28px",
  position: "relative",
  width: "100%",
  maxWidth: 620,
};

const btnPrimary: React.CSSProperties = {
  padding: "14px 28px",
  background: "#e8433a",
  color: "#fff",
  border: "1.5px solid #e8433a",
  boxShadow: "4px 4px 0 #16161a",
  borderRadius: 3,
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  transition: "all .18s",
  width: "100%",
};

const btnSecondary: React.CSSProperties = {
  padding: "14px 28px",
  background: "#fff",
  color: "#16161a",
  border: "1.5px solid #16161a",
  boxShadow: "4px 4px 0 #e9e9ee",
  borderRadius: 3,
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  transition: "all .18s",
  width: "100%",
};

const btnGhost: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 11,
  color: "#77788a",
  cursor: "pointer",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  textDecoration: "underline",
  padding: "4px 0",
};

const tagStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 10,
  letterSpacing: "1px",
  padding: "3px 9px",
  borderRadius: 3,
  fontWeight: 600,
};

export default function GameRoomWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <GameRoom roomId={resolvedParams.id} />;
}

function GameRoom({ roomId }: { roomId: string }) {
  const router = useRouter();

  // If visitor arrives at room link without a valid session for this room, redirect to join
  useEffect(() => {
    try {
      const s = localStorage.getItem("imposter_session");
      if (!s) {
        router.replace(`/room/join?code=${roomId}`);
        return;
      }
      const session = JSON.parse(s);
      if (!session || session.roomId !== roomId) {
        router.replace(`/room/join?code=${roomId}`);
      }
    } catch {
      router.replace(`/room/join?code=${roomId}`);
    }
  }, [roomId, router]);

  const { gameState, isConnected, isReconnecting, error, sendAction } =
    useGameSocket(roomId);

  const localPlayerId = React.useMemo(() => {
    try {
      const s = localStorage.getItem("imposter_session");
      return s ? (JSON.parse(s).playerId ?? "") : "";
    } catch {
      return "";
    }
  }, []);

  if (error) {
    return (
      <div
        className={`board ${space.className}`}
        style={{
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="board-lines" />
        <div
          style={{
            ...cardStyle,
            maxWidth: 420,
            textAlign: "center",
            transform: "rotate(-1deg)",
          }}
        >
          <span className="corner-tape a" />
          <div
            className={mono.className}
            style={{
              fontSize: 11,
              letterSpacing: 1,
              color: "#e8433a",
              border: "1px solid #e8433a",
              padding: "3px 9px",
              display: "inline-block",
              marginBottom: 16,
            }}
          >
            ROOM NOTICE
          </div>
          <p style={{ color: "#77788a", marginBottom: 24, fontSize: 14 }}>
            {error}
          </p>
          <Link
            href="/"
            className={`btn btn-primary ${space.className}`}
            style={{ display: "inline-block" }}
          >
            RETURN HOME
          </Link>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div
        className={`board ${space.className}`}
        style={{
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="board-lines" />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: "3px solid #e9e9ee",
              borderTopColor: "#e8433a",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 0.9s linear infinite",
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p
            className={mono.className}
            style={{ fontSize: 11, letterSpacing: "1.5px", color: "#77788a" }}
          >
            SYNCING SECURE CONNECTION...
          </p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.Players[localPlayerId];
  const isHost = gameState.IsSingleDevice || (currentPlayer?.isHost ?? false);

  const renderPhaseView = () => {
    switch (gameState.Phase) {
      case "LOBBY":
        return (
          <LobbyView
            gameState={gameState}
            isHost={isHost}
            localPlayerId={localPlayerId}
            sendAction={sendAction}
          />
        );
      case "REVEAL":
        return gameState.IsSingleDevice ? (
          <RevealViewSingleDevice
            gameState={gameState}
            isHost={isHost}
            sendAction={sendAction}
          />
        ) : (
          <RevealView
            currentPlayer={currentPlayer}
            currentCategory={gameState.CurrentCategory}
            isHost={isHost}
            sendAction={sendAction}
          />
        );
      case "DISCUSSION":
        return (
          <DiscussionView
            currentPlayer={currentPlayer}
            currentCategory={gameState.CurrentCategory}
            isHost={isHost}
            sendAction={sendAction}
          />
        );
      case "VOTING":
        return gameState.IsSingleDevice ? (
          <VotingViewSingleDevice
            gameState={gameState}
            isHost={isHost}
            sendAction={sendAction}
          />
        ) : (
          <VotingView
            gameState={gameState}
            currentPlayer={currentPlayer}
            isHost={isHost}
            sendAction={sendAction}
          />
        );
      case "RESULTS":
        return (
          <ResultsView
            gameState={gameState}
            isHost={isHost}
            localPlayerId={localPlayerId}
            sendAction={sendAction}
          />
        );
      default:
        return (
          <p
            className={mono.className}
            style={{ color: "#e8433a", fontSize: 13 }}
          >
            Unknown game phase.
          </p>
        );
    }
  };

  return (
    <div
      className={`board ${space.className}`}
      style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}
    >
      <div className="board-lines" />

      {isReconnecting && (
        <div
          style={{
            position: "fixed",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#fff8e6",
            border: "1.5px solid #f0b429",
            borderRadius: 20,
            padding: "6px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 600,
            color: "#b07a00",
          }}
          className={mono.className}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#f0b429",
              display: "inline-block",
            }}
          />
          <span>Reconnecting to game server...</span>
        </div>
      )}

      {}
      <header
        style={{
          position: "relative",
          zIndex: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "18px clamp(16px,4vw,48px)",
          background: "#fff",
          borderBottom: "1.5px solid #e9e9ee",
        }}
      >
        {}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="logo">
            <span className={`badge-icon ${mono.className}`}>3</span>
            IMPOSTER
          </div>
          <div
            className={mono.className}
            style={{
              fontSize: 11,
              letterSpacing: "0.8px",
              color: "#77788a",
              borderLeft: "1px solid #e9e9ee",
              paddingLeft: 14,
            }}
          >
            {gameState.IsSingleDevice ? (
              <span style={{ color: "#8c5cd8", fontWeight: 700 }}>
                📱 PASS &amp; PLAY (1 DEVICE)
              </span>
            ) : (
              <>
                ROOM{" "}
                <span style={{ color: "#e8433a", fontWeight: 600 }}>
                  #{gameState.ID}
                </span>
              </>
            )}
          </div>
        </div>

        {}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            className={mono.className}
            style={{
              ...tagStyle,
              background: "#fff8e6",
              color: "#b07a00",
              border: "1px solid #f0b429",
            }}
          >
            {gameState.Phase}
          </span>

          {gameState.IsSingleDevice && (
            <span
              className={mono.className}
              style={{
                ...tagStyle,
                background: "#f0ecfc",
                color: "#8c5cd8",
                border: "1px solid #8c5cd8",
              }}
            >
              HOTSEAT
            </span>
          )}

          {currentPlayer && !gameState.IsSingleDevice && (
            <>
              <span
                className={mono.className}
                style={{ fontSize: 12, color: "#77788a" }}
              >
                {currentPlayer.name}
              </span>
              <span
                className={mono.className}
                style={{
                  ...tagStyle,
                  background: "#f0ecfc",
                  color: "#8c5cd8",
                  border: "1px solid #e9e9ee",
                }}
              >
                {currentPlayer.score} pts
              </span>
            </>
          )}

          <button
            onClick={() => {
              sendAction("LEAVE_ROOM");
              router.push("/");
            }}
            className={mono.className}
            style={{
              fontSize: 11,
              letterSpacing: "0.8px",
              color: "#e8433a",
              border: "1px solid #e8433a",
              background: "none",
              padding: "5px 10px",
              borderRadius: 3,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Leave
          </button>
        </div>
      </header>

      {}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "40px clamp(16px,4vw,40px) 60px",
          position: "relative",
          zIndex: 5,
        }}
      >
        {renderPhaseView()}
      </div>

      {!gameState.IsSingleDevice && (
        <ChatDrawer
          messages={gameState.ChatMessages || []}
          currentPlayer={currentPlayer}
          localPlayerId={localPlayerId}
          phase={gameState.Phase}
          roomId={gameState.ID}
          onSendMessage={(text) => sendAction("SEND_CHAT", { text })}
        />
      )}
    </div>
  );
}

function LobbyView({
  gameState,
  isHost,
  localPlayerId,
  sendAction,
}: {
  gameState: GameState;
  isHost: boolean;
  localPlayerId: string;
  sendAction: (type: string, payload?: Record<string, unknown>) => void;
}) {
  const sortedPlayers = useMemo(() => {
    return Object.values(gameState.Players).sort((a, b) => a.order - b.order);
  }, [gameState.Players]);

  const playersKey = sortedPlayers
    .map((p) => `${p.id}:${p.order}:${p.name}:${p.isHost}:${p.isDead}`)
    .join("|");

  const [prevPlayersKey, setPrevPlayersKey] = useState(playersKey);
  const [orderedPlayers, setOrderedPlayers] = useState(sortedPlayers);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newLocalName, setNewLocalName] = useState("");
  const [customImposters, setCustomImposters] = useState(1);
  const [copied, setCopied] = useState(false);

  const getInviteUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/room/join?code=${gameState.ID}`;
  };

  const handleCopyInviteLink = async () => {
    const url = getInviteUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    const url = getInviteUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join my Imposter game!",
          text: `Join our Imposter room with code ${gameState.ID}:`,
          url: url,
        });
        return;
      } catch {
        // User cancelled or share failed
      }
    }
    handleCopyInviteLink();
  };

  // Safely sync with server state only when player data actually changes (value comparison)
  if (playersKey !== prevPlayersKey) {
    setPrevPlayersKey(playersKey);
    setOrderedPlayers(sortedPlayers);
  }

  const handleReorder = (newOrder: Player[]) => {
    setOrderedPlayers(newOrder);
    sendAction("REORDER_PLAYERS", {
      playerIds: newOrder.map((p) => p.id),
    });
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    if (!isHost) return;
    if (toIndex < 0 || toIndex >= orderedPlayers.length) return;
    const updated = [...orderedPlayers];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    handleReorder(updated);
  };

  const handleAddLocalPlayer = () => {
    if (!newLocalName.trim()) return;
    sendAction("ADD_LOCAL_PLAYER", {
      id: crypto.randomUUID(),
      name: newLocalName.trim(),
    });
    setNewLocalName("");
  };

  return (
    <div style={{ ...cardStyle, maxWidth: 680 }}>
      {/* Tape decoration */}
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "1px",
          color: "#77788a",
          marginBottom: 6,
        }}
      >
        ROOM STATUS · GATHERING PERSONNEL
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 20,
        }}
      >
        <h2
          className={kalam.className}
          style={{
            fontSize: "clamp(1.6rem,4vw,2.2rem)",
            color: "#16161a",
            margin: 0,
          }}
        >
          Lobby
        </h2>
        {isHost && orderedPlayers.length > 1 && (
          <span
            className={mono.className}
            style={{ fontSize: 10, color: "#77788a" }}
          >
            Drag or use arrows to set pass/turn order
          </span>
        )}
      </div>

      {/* Prominent Room Code / Share Card for Multi-Device Mode */}
      {!gameState.IsSingleDevice ? (
        <div
          style={{
            background: "#fafafa",
            border: "1.5px solid #16161a",
            boxShadow: "3px 3px 0 #16161a",
            borderRadius: 4,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <div
              className={mono.className}
              style={{
                fontSize: 10,
                letterSpacing: "1px",
                color: "#e8433a",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              ROOM CODE · SHARE WITH PLAYERS
            </div>
            <div
              className={space.className}
              style={{
                fontSize: "clamp(2rem, 5vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "3px",
                color: "#16161a",
                lineHeight: 1,
              }}
            >
              {gameState.ID}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className={space.className}
              style={{
                padding: "10px 16px",
                background: copied ? "#22a866" : "#16161a",
                color: "#ffffff",
                border: "1.5px solid #16161a",
                borderRadius: 3,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <span>{copied ? "✓ COPIED LINK!" : "📋 COPY INVITE LINK"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className={space.className}
              style={{
                padding: "10px 14px",
                background: "#ffffff",
                color: "#16161a",
                border: "1.5px solid #16161a",
                borderRadius: 3,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>🔗 SHARE</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#f0ecfc",
            border: "1.5px solid #8c5cd8",
            borderRadius: 4,
            padding: "12px 16px",
            marginBottom: 24,
          }}
        >
          <div
            className={mono.className}
            style={{
              fontSize: 10.5,
              letterSpacing: "1px",
              color: "#8c5cd8",
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            📱 LOCAL PASS &amp; PLAY (HOTSEAT)
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "#16161a",
              lineHeight: 1.35,
            }}
          >
            All players share this single device. Add names below. When the round starts, pass this phone around.
          </div>
        </div>
      )}

      {/* Players List with Drag & Drop + Move Arrows */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {orderedPlayers.map((p, i) => {
          const isMe = p.id === localPlayerId;
          const isDragging = draggedIndex === i;

          return (
            <div
              key={p.id}
              draggable={isHost}
              onDragStart={(e) => {
                if (!isHost) return;
                setDraggedIndex(i);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", `${i}`);
              }}
              onDragOver={(e) => {
                if (!isHost) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                if (!isHost) return;
                e.preventDefault();
                const fromIdxStr = e.dataTransfer.getData("text/plain");
                const fromIdx = fromIdxStr !== "" ? parseInt(fromIdxStr, 10) : draggedIndex;
                if (fromIdx !== null && fromIdx !== undefined && fromIdx !== i) {
                  movePlayer(fromIdx, i);
                }
                setDraggedIndex(null);
              }}
              onDragEnd={() => setDraggedIndex(null)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: isDragging
                  ? "#edeef2"
                  : isMe
                  ? "#fff8e6"
                  : "#fafafa",
                borderWidth: "1.5px 1.5px 1.5px 4px",
                borderStyle: isDragging ? "dashed" : "solid",
                borderColor: isDragging
                  ? "#77788a"
                  : isMe
                  ? "#f0b429"
                  : "#e9e9ee",
                borderRadius: 3,
                cursor: isHost ? "grab" : "default",
                opacity: isDragging ? 0.6 : 1,
                transition: "background 0.15s, opacity 0.15s",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  overflow: "hidden",
                }}
              >
                {isHost && (
                  <span
                    title="Drag to reorder"
                    style={{
                      cursor: "grab",
                      color: "#aaaab5",
                      fontSize: 14,
                      lineHeight: 1,
                      padding: "0 2px",
                    }}
                  >
                    ⋮⋮
                  </span>
                )}
                <span
                  className={mono.className}
                  style={{ fontSize: 9.5, color: "#77788a", minWidth: 20 }}
                >
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                  {isMe && (
                    <span
                      className={mono.className}
                      style={{ fontSize: 9, color: "#77788a", marginLeft: 5 }}
                    >
                      (YOU)
                    </span>
                  )}
                  {p.isDead && (
                    <span
                      className={mono.className}
                      style={{ fontSize: 9, color: "#e8433a", marginLeft: 5 }}
                    >
                      LEFT
                    </span>
                  )}
                  {p.isConnected === false && (
                    <span
                      className={mono.className}
                      style={{
                        fontSize: 8.5,
                        color: "#b07a00",
                        background: "#fff8e6",
                        border: "1px solid #f0b429",
                        padding: "1px 4px",
                        borderRadius: 2,
                        marginLeft: 5,
                      }}
                    >
                      RECONNECTING
                    </span>
                  )}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {isHost && (gameState.IsSingleDevice ? orderedPlayers.length > 1 : (!p.isHost && !isMe)) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const label = gameState.IsSingleDevice ? "Remove" : "Kick";
                      if (confirm(`${label} ${p.name}?`)) {
                        sendAction("KICK_PLAYER", { targetId: p.id });
                      }
                    }}
                    title={`${gameState.IsSingleDevice ? "Remove" : "Kick"} ${p.name}`}
                    style={{
                      background: "#fff0ef",
                      border: "1px solid #e8433a",
                      color: "#e8433a",
                      borderRadius: 3,
                      padding: "4px 7px",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                    className={mono.className}
                  >
                    {gameState.IsSingleDevice ? "REMOVE" : "KICK"}
                  </button>
                )}
                {p.isHost && (
                  <span
                    className={mono.className}
                    style={{
                      fontSize: 8.5,
                      letterSpacing: "0.5px",
                      background: "#f0b429",
                      color: "#16161a",
                      padding: "1px 5px",
                      borderRadius: 2,
                      fontWeight: 700,
                    }}
                  >
                    HOST
                  </span>
                )}

                {isHost && orderedPlayers.length > 1 && (
                  <div style={{ display: "flex", gap: 3 }}>
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        movePlayer(i, i - 1);
                      }}
                      title="Move up / earlier"
                      style={{
                        background: "#fff",
                        border: "1px solid #dcdce2",
                        borderRadius: 3,
                        padding: "4px 8px",
                        fontSize: 11,
                        cursor: i === 0 ? "not-allowed" : "pointer",
                        opacity: i === 0 ? 0.35 : 1,
                        color: "#16161a",
                        lineHeight: 1,
                        minWidth: 26,
                        minHeight: 26,
                        touchAction: "manipulation",
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={i === orderedPlayers.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        movePlayer(i, i + 1);
                      }}
                      title="Move down / later"
                      style={{
                        background: "#fff",
                        border: "1px solid #dcdce2",
                        borderRadius: 3,
                        padding: "4px 8px",
                        fontSize: 11,
                        cursor: i === orderedPlayers.length - 1 ? "not-allowed" : "pointer",
                        opacity: i === orderedPlayers.length - 1 ? 0.35 : 1,
                        color: "#16161a",
                        lineHeight: 1,
                        minWidth: 26,
                        minHeight: 26,
                        touchAction: "manipulation",
                      }}
                    >
                      ▼
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Single Device: Inline Player Add */}
        {gameState.IsSingleDevice && isHost && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 14px",
              border: "1.5px dashed #e9e9ee",
              borderRadius: 3,
              background: "#fafafa",
            }}
          >
            <input
              type="text"
              value={newLocalName}
              onChange={(e) => setNewLocalName(e.target.value)}
              placeholder="Add player..."
              style={{
                background: "transparent",
                outline: "none",
                border: "none",
                width: "100%",
                fontSize: 14,
                color: "#16161a",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddLocalPlayer()}
            />
            <button
              onClick={handleAddLocalPlayer}
              className={mono.className}
              style={{
                fontSize: 10,
                letterSpacing: "0.5px",
                color: "#e8433a",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              ADD
            </button>
          </div>
        )}
      </div>

      {}
      <div
        style={{
          borderTop: "1px solid #e9e9ee",
          paddingTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {!isHost ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CategorySelector
              selectedCategories={gameState.ActiveCategories || EMPTY_CATEGORIES}
              isHost={false}
              onUpdateCategories={() => {}}
            />
            <p
              className={mono.className}
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#77788a",
                letterSpacing: "0.5px",
              }}
            >
              Waiting for the host to start the game...
            </p>
          </div>
        ) : (
          <>
            <CategorySelector
              selectedCategories={gameState.ActiveCategories || EMPTY_CATEGORIES}
              isHost={true}
              onUpdateCategories={(newCats: string[]) =>
                sendAction("UPDATE_CATEGORIES", { categories: newCats })
              }
            />

            {orderedPlayers.length >= 4 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fafafa",
                  padding: "12px 14px",
                  border: "1.5px solid #e9e9ee",
                  borderRadius: 3,
                }}
              >
                <span
                  className={mono.className}
                  style={{
                    fontSize: 11,
                    color: "#77788a",
                    letterSpacing: "0.5px",
                  }}
                >
                  IMPOSTER COUNT
                </span>
                <select
                  value={customImposters}
                  onChange={(e) => setCustomImposters(Number(e.target.value))}
                  className={mono.className}
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "#16161a",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "right",
                  }}
                >
                  {[
                    ...Array(
                      Math.max(1, Math.floor((orderedPlayers.length - 1) / 2)),
                    ),
                  ].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? "Imposter" : "Imposters"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() =>
                sendAction("START", {
                  imposterCount: customImposters,
                  categories: gameState.ActiveCategories || [],
                })
              }
              disabled={orderedPlayers.length < 3}
              style={{
                ...btnPrimary,
                background: orderedPlayers.length >= 3 ? "#e8433a" : "#e9e9ee",
                borderColor: orderedPlayers.length >= 3 ? "#e8433a" : "#e9e9ee",
                color: orderedPlayers.length >= 3 ? "#fff" : "#77788a",
                boxShadow: orderedPlayers.length >= 3 ? "4px 4px 0 #16161a" : "none",
                cursor: orderedPlayers.length >= 3 ? "pointer" : "not-allowed",
              }}
              className={space.className}
            >
              {orderedPlayers.length < 3
                ? `NEEDS ${3 - orderedPlayers.length} MORE PLAYER${3 - orderedPlayers.length > 1 ? "S" : ""}`
                : "START GAME →"}
            </button>
            <button
              onClick={() => sendAction("CLOSE_ROOM")}
              className={mono.className}
              style={btnGhost}
            >
              Terminate Room Permanently
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DiscussionView({
  currentPlayer,
  currentCategory,
  isHost,
  sendAction,
}: {
  currentPlayer: Player | undefined;
  currentCategory?: string;
  isHost: boolean;
  sendAction: (type: string) => void;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderLeft: "5px solid #e8433a",
        textAlign: "center",
        transform: "rotate(-0.4deg)",
      }}
    >
      <span className="corner-tape a" />

      <div
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "1px",
          color: "#e8433a",
          marginBottom: 12,
        }}
      >
        PHASE · LIVE DISCUSSION
      </div>

      {currentCategory && (
        <div
          className={mono.className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid #16161a",
            boxShadow: "2px 2px 0 #e8433a",
            padding: "4px 10px",
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          <span>
            {CATEGORIES[currentCategory as CategoryKey]?.emoji || "🏷️"}
          </span>
          <span>
            THEME:{" "}
            {CATEGORIES[currentCategory as CategoryKey]?.label || currentCategory}
          </span>
        </div>
      )}

      <h2
        className={kalam.className}
        style={{
          fontSize: "clamp(1.8rem,4.5vw,2.6rem)",
          marginBottom: 10,
          color: "#16161a",
        }}
      >
        Talk it out.
      </h2>
      <p
        style={{
          color: "#77788a",
          fontSize: 15,
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        Find the imposter. No time limit — discuss freely.
      </p>

      {currentPlayer?.isDead && (
        <div
          className={mono.className}
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            background: "#fff0ef",
            border: "1px solid #e8433a",
            fontSize: 12,
            color: "#e8433a",
            borderRadius: 3,
          }}
        >
          You are eliminated. You may not speak.
        </div>
      )}

      {isHost && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => sendAction("PROGRESS_VOTING")}
            style={btnPrimary}
            className={space.className}
          >
            MOVE TO VOTING →
          </button>
          <button
            onClick={() => sendAction("ABORT_TO_LOBBY")}
            style={btnGhost}
            className={mono.className}
          >
            Abort Round / Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

function ResultsView({
  gameState,
  isHost,
  localPlayerId,
  sendAction,
}: {
  gameState: GameState;
  isHost: boolean;
  localPlayerId: string;
  sendAction: (type: string, payload?: Record<string, unknown>) => void;
}) {
  const gameContinues = gameState.Winner === "NONE";

  return (
    <div style={{ ...cardStyle, maxWidth: 580, transform: "rotate(0.5deg)" }}>
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "1px",
          color: "#77788a",
          marginBottom: 12,
        }}
      >
        {gameContinues ? "ROUND COMPLETE" : "GAME OVER"}
      </div>

      <h2
        className={kalam.className}
        style={{
          fontSize: "clamp(1.8rem,4vw,2.4rem)",
          marginBottom: 14,
          color: "#16161a",
        }}
      >
        {gameContinues ? "Round Over." : "Game Over."}
      </h2>

      {gameState.CurrentCategory && (
        <div
          className={mono.className}
          style={{
            padding: "9px 13px",
            background: "#fafafa",
            border: "1.5px dashed #16161a",
            borderRadius: 3,
            fontSize: 12,
            color: "#16161a",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#77788a", fontSize: 11 }}>ROUND THEME:</span>
          <span style={{ fontWeight: 700 }}>
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.emoji || "🏷️"}{" "}
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.label || gameState.CurrentCategory}
          </span>
        </div>
      )}

      {}
      <div
        style={{
          padding: "14px 16px",
          background: "#fff0ef",
          border: "1.5px solid #e8433a",
          borderRadius: 3,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          className={mono.className}
          style={{ fontSize: 11, color: "#e8433a" }}
        >
          ELIMINATED
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#16161a" }}>
          {gameState.LastEliminated}
        </span>
      </div>

      {}
      {!gameContinues && (
        <div
          style={{
            padding: "20px 16px",
            background: gameState.Winner === "CREW" ? "#edf9f2" : "#fff0ef",
            border: `1.5px solid ${gameState.Winner === "CREW" ? "#22a866" : "#e8433a"}`,
            borderRadius: 3,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <span
            className={kalam.className}
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: gameState.Winner === "CREW" ? "#22a866" : "#e8433a",
            }}
          >
            {gameState.Winner} WINS
          </span>
        </div>
      )}

      {}
      <div style={{ marginBottom: 24 }}>
        <p
          className={mono.className}
          style={{
            fontSize: 10,
            letterSpacing: "1px",
            color: "#77788a",
            marginBottom: 10,
          }}
        >
          STANDINGS
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.values(gameState.Players)
            .sort((a, b) => b.score - a.score)
            .map((p, i) => {
              const isMe = p.id === localPlayerId;
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: isMe ? "#fff8e6" : "#fafafa",
                    border: `1.5px solid ${isMe ? "#f0b429" : "#e9e9ee"}`,
                    borderRadius: 3,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      className={mono.className}
                      style={{ fontSize: 9, color: "#77788a", minWidth: 20 }}
                    >
                      #{i + 1}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: p.isDead ? "#77788a" : "#16161a",
                        textDecoration: p.isDead ? "line-through" : "none",
                      }}
                    >
                      {p.name}
                      {isMe && (
                        <span
                          className={mono.className}
                          style={{
                            fontSize: 9,
                            color: "#77788a",
                            marginLeft: 6,
                          }}
                        >
                          (YOU)
                        </span>
                      )}
                    </span>
                    {p.isDead && (
                      <span
                        className={mono.className}
                        style={{
                          fontSize: 9,
                          color: "#e8433a",
                          border: "1px solid #e8433a",
                          padding: "1px 5px",
                          borderRadius: 2,
                        }}
                      >
                        OUT
                      </span>
                    )}
                  </div>
                  <span
                    style={{ fontWeight: 700, color: "#8c5cd8", fontSize: 15 }}
                  >
                    {p.score} pts
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {!gameContinues && isHost && (
        <div style={{ marginBottom: 16 }}>
          <CategorySelector
            selectedCategories={gameState.ActiveCategories || EMPTY_CATEGORIES}
            isHost={true}
            onUpdateCategories={(newCats: string[]) =>
              sendAction("UPDATE_CATEGORIES", { categories: newCats })
            }
          />
        </div>
      )}

      {isHost && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() =>
              sendAction(gameContinues ? "CONTINUE_DISCUSSION" : "NEXT_ROUND")
            }
            style={btnPrimary}
            className={space.className}
          >
            {gameContinues ? "RESUME DISCUSSION →" : "NEW ROUND →"}
          </button>
          <button
            onClick={() => sendAction("ABORT_TO_LOBBY")}
            style={btnGhost}
            className={mono.className}
          >
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

function RevealView({
  currentPlayer,
  currentCategory,
  isHost,
  sendAction,
}: {
  currentPlayer: Player | undefined;
  currentCategory?: string;
  isHost: boolean;
  sendAction: (type: string) => void;
}) {
  if (!currentPlayer) return null;

  return (
    <div
      style={{
        ...cardStyle,
        textAlign: "center",
        transform: "rotate(-0.5deg)",
      }}
    >
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "1px",
          color: "#77788a",
          marginBottom: 16,
        }}
      >
        EYES ONLY · YOUR SECRET WORD
      </div>

      {currentCategory && (
        <div
          className={mono.className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid #16161a",
            boxShadow: "2px 2px 0 #e8433a",
            padding: "4px 10px",
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <span>
            {CATEGORIES[currentCategory as CategoryKey]?.emoji || "🏷️"}
          </span>
          <span>
            THEME:{" "}
            {CATEGORIES[currentCategory as CategoryKey]?.label || currentCategory}
          </span>
        </div>
      )}

      {!currentPlayer.isReady ? (
        <>
          <div
            style={{
              padding: "30px 20px",
              background: "#fafafa",
              border: "1.5px solid #e9e9ee",
              marginBottom: 24,
              borderRadius: 3,
            }}
          >
            <span
              className={kalam.className}
              style={{
                fontSize: "clamp(2.2rem,8vw,3.5rem)",
                fontWeight: 700,
                color: "#e8433a",
              }}
            >
              {currentPlayer.Word ?? "—"}
            </span>
          </div>
          <button
            onClick={() => sendAction("MARK_READY")}
            style={btnPrimary}
            className={space.className}
          >
            I MEMORIZED IT ✓
          </button>
        </>
      ) : (
        <p
          className={mono.className}
          style={{
            fontSize: 13,
            color: "#77788a",
            padding: "30px 0",
            letterSpacing: "0.5px",
          }}
        >
          Waiting for all players to confirm...
        </p>
      )}

      {isHost && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => sendAction("FORCE_START_DISCUSSION")}
            style={{
              ...btnSecondary,
              padding: "10px 18px",
              fontSize: 13,
            }}
            className={space.className}
          >
            FORCE START DISCUSSION →
          </button>
          <button
            onClick={() => sendAction("ABORT_TO_LOBBY")}
            style={btnGhost}
            className={mono.className}
          >
            Abort Round / Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

function VotingView({
  gameState,
  currentPlayer,
  isHost,
  sendAction,
}: {
  gameState: GameState;
  currentPlayer: Player | undefined;
  isHost: boolean;
  sendAction: (type: string, payload?: Record<string, unknown>) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("");

  if (currentPlayer?.isDead) {
    return (
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <p
          className={kalam.className}
          style={{ fontSize: "1.8rem", color: "#77788a" }}
        >
          You are eliminated. The survivors are voting.
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, transform: "rotate(0.3deg)" }}>
      <span className="corner-tape a" />

      <div
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "1px",
          color: "#e8433a",
          marginBottom: 16,
        }}
      >
        PHASE · CAST YOUR VOTE
      </div>

      {gameState.CurrentCategory && (
        <div
          className={mono.className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid #16161a",
            boxShadow: "2px 2px 0 #e8433a",
            padding: "4px 10px",
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <span>
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.emoji || "🏷️"}
          </span>
          <span>
            THEME:{" "}
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.label || gameState.CurrentCategory}
          </span>
        </div>
      )}

      <h2
        className={kalam.className}
        style={{
          fontSize: "clamp(1.6rem,4vw,2.2rem)",
          marginBottom: 20,
          color: "#16161a",
        }}
      >
        Who&apos;s the imposter?
      </h2>

      {currentPlayer?.hasVoted ? (
        <div
          style={{
            padding: "32px 20px",
            background: "#fafafa",
            border: "1.5px solid #e9e9ee",
            textAlign: "center",
            borderRadius: 3,
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            Vote locked in.
          </p>
          <p
            className={mono.className}
            style={{ fontSize: 12, color: "#77788a" }}
          >
            Waiting for everyone to vote...
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {Object.values(gameState.Players)
              .sort((a, b) => a.order - b.order)
              .map((p) => {
                if (p.id === currentPlayer?.id || p.isDead) return null;
                const isSelected = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      padding: "14px 12px",
                      background: isSelected ? "#fff0ef" : "#fafafa",
                      borderWidth: "1.5px 1.5px 1.5px 4px",
                      borderStyle: "solid",
                      borderColor: isSelected ? "#e8433a" : "#e9e9ee",
                      borderRadius: 3,
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: 15,
                      color: isSelected ? "#e8433a" : "#16161a",
                      transition: "all .15s",
                      transform: isSelected ? "translateY(-2px)" : "none",
                    }}
                    className={space.className}
                  >
                    <span>{p.name}</span>
                    {p.isConnected === false && (
                      <span
                        className={mono.className}
                        style={{
                          fontSize: 9,
                          color: "#b07a00",
                          marginLeft: 6,
                          fontWeight: 500,
                        }}
                      >
                        (reconnecting)
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          <button
            onClick={() => sendAction("CAST_VOTE", { targetId: selectedId })}
            disabled={!selectedId}
            style={{
              ...btnPrimary,
              background: selectedId ? "#e8433a" : "#e9e9ee",
              borderColor: selectedId ? "#e8433a" : "#e9e9ee",
              color: selectedId ? "#fff" : "#77788a",
              boxShadow: selectedId ? "4px 4px 0 #16161a" : "none",
              cursor: selectedId ? "pointer" : "not-allowed",
            }}
            className={space.className}
          >
            CONFIRM ELIMINATION
          </button>
        </>
      )}

      {isHost && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24, textAlign: "center" }}>
          <button
            onClick={() => sendAction("FORCE_TALLY_VOTES")}
            style={{
              ...btnSecondary,
              padding: "10px 18px",
              fontSize: 13,
            }}
            className={space.className}
          >
            FORCE TALLY VOTES →
          </button>
          <button
            onClick={() => sendAction("ABORT_TO_LOBBY")}
            style={btnGhost}
            className={mono.className}
          >
            Abort Round / Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

function RevealViewSingleDevice({
  gameState,
  isHost,
  sendAction,
}: {
  gameState: GameState;
  isHost: boolean;
  sendAction: (type: string) => void;
}) {
  const storageKey = `hotseat_index_${gameState.ID}`;

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = sessionStorage.getItem(storageKey);
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [showWord, setShowWord] = useState(false);

  const activePlayers = Object.values(gameState.Players)
    .sort((a, b) => a.order - b.order)
    .filter((p) => !p.isDead);

  const isLastPlayer = currentIndex === activePlayers.length - 1;
  const currentSeat = activePlayers[currentIndex];

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, String(currentIndex));
    }
  }, [currentIndex, storageKey]);

  const handleMemorized = () => {
    setShowWord(false);
    if (isLastPlayer) {
      sessionStorage.removeItem(storageKey);
      sendAction("CONTINUE_DISCUSSION");
    } else {
      setCurrentIndex((c) => c + 1);
    }
  };

  if (!currentSeat) return null;

  return (
    <div
      style={{
        ...cardStyle,
        textAlign: "center",
        transform: "rotate(-0.6deg)",
      }}
    >
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "1px",
          color: "#77788a",
          marginBottom: 8,
        }}
      >
        HOTSEAT HANDOFF · {currentIndex + 1} of {activePlayers.length}
      </div>

      {gameState.CurrentCategory && (
        <div
          className={mono.className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid #16161a",
            boxShadow: "2px 2px 0 #e8433a",
            padding: "4px 10px",
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <span>
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.emoji || "🏷️"}
          </span>
          <span>
            THEME:{" "}
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.label || gameState.CurrentCategory}
          </span>
        </div>
      )}

      <h2
        className={kalam.className}
        style={{
          fontSize: "clamp(1.4rem,4vw,2rem)",
          marginBottom: 24,
          color: "#16161a",
        }}
      >
        Pass the device to{" "}
        <span style={{ color: "#8c5cd8" }}>{currentSeat.name}</span>
      </h2>

      <div
        style={{
          padding: "28px 20px",
          background: "#fafafa",
          border: "1.5px solid #e9e9ee",
          marginBottom: 20,
          borderRadius: 3,
          minHeight: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showWord ? (
          <span
            className={kalam.className}
            style={{
              fontSize: "clamp(2rem,7vw,3rem)",
              fontWeight: 700,
              color: "#e8433a",
            }}
          >
            {currentSeat.Word ?? "—"}
          </span>
        ) : (
          <span
            className={mono.className}
            style={{ fontSize: 13, color: "#77788a", fontStyle: "italic" }}
          >
            Word securely hidden
          </span>
        )}
      </div>

      {showWord ? (
        <button
          onClick={handleMemorized}
          style={btnPrimary}
          className={space.className}
        >
          {isLastPlayer ? "I MEMORIZED IT ✓ — START" : "I MEMORIZED IT ✓ — NEXT PLAYER"}
        </button>
      ) : (
        <button
          onClick={() => setShowWord(true)}
          style={btnSecondary}
          className={space.className}
        >
          TAP WHEN READY
        </button>
      )}

      {isHost && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => sendAction("FORCE_START_DISCUSSION")}
            style={{
              ...btnSecondary,
              padding: "10px 18px",
              fontSize: 13,
            }}
            className={space.className}
          >
            FORCE START DISCUSSION →
          </button>
          <button
            onClick={() => sendAction("ABORT_TO_LOBBY")}
            style={btnGhost}
            className={mono.className}
          >
            Abort Round / Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

function VotingViewSingleDevice({
  gameState,
  isHost,
  sendAction,
}: {
  gameState: GameState;
  isHost: boolean;
  sendAction: (type: string, payload?: Record<string, unknown>) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("");

  return (
    <div
      style={{
        ...cardStyle,
        borderLeft: "5px solid #e8433a",
        transform: "rotate(0.3deg)",
      }}
    >
      <span className="corner-tape a" />

      <div
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "1px",
          color: "#e8433a",
          marginBottom: 16,
        }}
      >
        PHASE · PUBLIC CONSENSUS VOTE
      </div>

      {gameState.CurrentCategory && (
        <div
          className={mono.className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid #16161a",
            boxShadow: "2px 2px 0 #e8433a",
            padding: "4px 10px",
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <span>
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.emoji || "🏷️"}
          </span>
          <span>
            THEME:{" "}
            {CATEGORIES[gameState.CurrentCategory as CategoryKey]?.label || gameState.CurrentCategory}
          </span>
        </div>
      )}

      <h2
        className={kalam.className}
        style={{
          fontSize: "clamp(1.6rem,4vw,2.2rem)",
          marginBottom: 8,
          color: "#16161a",
        }}
      >
        Who&apos;s the imposter?
      </h2>
      <p style={{ fontSize: 14, color: "#77788a", marginBottom: 20 }}>
        Discuss out loud. Admin executes the group&apos;s final decision.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {Object.values(gameState.Players)
          .sort((a, b) => a.order - b.order)
          .map((p) => {
            if (p.isDead) return null;
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  padding: "14px 12px",
                  background: isSelected ? "#fff0ef" : "#fafafa",
                  borderWidth: "1.5px 1.5px 1.5px 4px",
                  borderStyle: "solid",
                  borderColor: isSelected ? "#e8433a" : "#e9e9ee",
                  borderRadius: 3,
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: 15,
                  color: isSelected ? "#e8433a" : "#16161a",
                  transition: "all .15s",
                  transform: isSelected ? "translateY(-2px)" : "none",
                }}
                className={space.className}
              >
                {p.name}
              </button>
            );
          })}
      </div>

      {isHost && (
        <>
          <button
            onClick={() =>
              sendAction("FORCE_ELIMINATE", { targetId: selectedId })
            }
            disabled={!selectedId}
            style={{
              ...btnPrimary,
              background: selectedId ? "#e8433a" : "#e9e9ee",
              borderColor: selectedId ? "#e8433a" : "#e9e9ee",
              color: selectedId ? "#fff" : "#77788a",
              boxShadow: selectedId ? "4px 4px 0 #16161a" : "none",
              cursor: selectedId ? "pointer" : "not-allowed",
            }}
            className={space.className}
          >
            EXECUTE SELECTED TARGET
          </button>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={() => sendAction("ABORT_TO_LOBBY")}
              style={btnGhost}
              className={mono.className}
            >
              Abort Round / Back to Lobby
            </button>
          </div>
        </>
      )}
    </div>
  );
}
