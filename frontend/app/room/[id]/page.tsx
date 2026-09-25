"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameSocket } from "@/hooks/useGameSocket";
import type { GameState, Player } from "@/hooks/useGameSocket";
import Link from "next/link";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"] });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

// ─── Shared style helpers ────────────────────────────────────────────────────
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

// ─── Wrapper ────────────────────────────────────────────────────────────────
export default function GameRoomWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <GameRoom roomId={resolvedParams.id} />;
}

// ─── Main room shell ─────────────────────────────────────────────────────────
function GameRoom({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { gameState, isConnected, error, sendAction } = useGameSocket(roomId);

  const localPlayerId = React.useMemo(() => {
    try {
      const s = localStorage.getItem("imposter_session");
      return s ? (JSON.parse(s).playerId ?? "") : "";
    } catch {
      return "";
    }
  }, []);

  // ── Error screen ──
  if (error) {
    return (
      <div
        className={`board ${space.className}`}
        style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="board-lines" />
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: "center", transform: "rotate(-1deg)" }}>
          <span className="corner-tape a" />
          <div
            className={mono.className}
            style={{ fontSize: 11, letterSpacing: 1, color: "#e8433a", border: "1px solid #e8433a", padding: "3px 9px", display: "inline-block", marginBottom: 16 }}
          >
            CASE CLOSED · CONNECTION LOST
          </div>
          <p style={{ color: "#77788a", marginBottom: 24, fontSize: 14 }}>{error}</p>
          <Link href="/" className={`btn btn-primary ${space.className}`} style={{ display: "inline-block" }}>
            RETURN HOME
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading screen ──
  if (!isConnected || !gameState) {
    return (
      <div
        className={`board ${space.className}`}
        style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="board-lines" />
        <div style={{ textAlign: "center" }}>
          {/* animated spinner made of border */}
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
          <p className={mono.className} style={{ fontSize: 11, letterSpacing: "1.5px", color: "#77788a" }}>
            SYNCING SECURE CONNECTION...
          </p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.Players[localPlayerId];
  const isHost = currentPlayer?.isHost ?? false;

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
          <RevealViewSingleDevice gameState={gameState} isHost={isHost} sendAction={sendAction} />
        ) : (
          <RevealView currentPlayer={currentPlayer} isHost={isHost} sendAction={sendAction} />
        );
      case "DISCUSSION":
        return (
          <DiscussionView
            currentPlayer={currentPlayer}
            isHost={isHost}
            sendAction={sendAction}
          />
        );
      case "VOTING":
        return gameState.IsSingleDevice ? (
          <VotingViewSingleDevice gameState={gameState} isHost={isHost} sendAction={sendAction} />
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
          <p className={mono.className} style={{ color: "#e8433a", fontSize: 13 }}>
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

      {/* Header bar */}
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
        {/* Left: logo + room id */}
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
            CASE{" "}
            <span style={{ color: "#e8433a", fontWeight: 600 }}>#{gameState.ID}</span>
          </div>
        </div>

        {/* Right: phase badge + player info + leave */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
            onClick={() => { sendAction("LEAVE_ROOM"); router.push("/"); }}
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

      {/* Phase content */}
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
    </div>
  );
}

// ─────────────────────────────────────────────
// LOBBY VIEW
// ─────────────────────────────────────────────
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
  const players = Object.values(gameState.Players).sort((a, b) => a.order - b.order);
  const [newLocalName, setNewLocalName] = useState("");

  const handleAddLocalPlayer = () => {
    if (!newLocalName.trim()) return;
    sendAction("ADD_LOCAL_PLAYER", { id: crypto.randomUUID(), name: newLocalName.trim() });
    setNewLocalName("");
  };

  return (
    <div style={{ ...cardStyle, maxWidth: 680 }}>
      {/* Tape accents */}
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div className={mono.className} style={{ fontSize: 11, letterSpacing: "1px", color: "#77788a", marginBottom: 6 }}>
        CASE STATUS · GATHERING PERSONNEL
      </div>
      <h2
        className={kalam.className}
        style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", marginBottom: 24, color: "#16161a" }}
      >
        Lobby
      </h2>

      {/* Player grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 24 }}>
        {players.map((p, i) => {
          const isMe = p.id === localPlayerId;
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: isMe ? "#fff8e6" : "#fafafa",
                border: `1.5px solid ${isMe ? "#f0b429" : "#e9e9ee"}`,
                borderLeft: `4px solid ${isMe ? "#f0b429" : "#e9e9ee"}`,
                borderRadius: 3,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className={mono.className}
                  style={{ fontSize: 9, color: "#77788a" }}
                >
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {p.name}
                  {isMe && (
                    <span
                      className={mono.className}
                      style={{ fontSize: 9, color: "#77788a", marginLeft: 6 }}
                    >
                      (YOU)
                    </span>
                  )}
                  {p.isDead && (
                    <span
                      className={mono.className}
                      style={{ fontSize: 9, color: "#e8433a", marginLeft: 6 }}
                    >
                      LEFT
                    </span>
                  )}
                </span>
              </div>
              {p.isHost && (
                <span
                  className={mono.className}
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.5px",
                    background: "#f0b429",
                    color: "#16161a",
                    padding: "2px 6px",
                    borderRadius: 2,
                    fontWeight: 700,
                  }}
                >
                  HOST
                </span>
              )}
            </div>
          );
        })}

        {/* Add local player input (hotseat) */}
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

      {/* Actions */}
      <div style={{ borderTop: "1px solid #e9e9ee", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {!isHost ? (
          <p
            className={mono.className}
            style={{ textAlign: "center", fontSize: 12, color: "#77788a", letterSpacing: "0.5px" }}
          >
            Waiting for the host to start the game...
          </p>
        ) : (
          <>
            <button
              onClick={() => sendAction("START")}
              disabled={players.length < 3}
              style={{
                ...btnPrimary,
                background: players.length >= 3 ? "#e8433a" : "#e9e9ee",
                borderColor: players.length >= 3 ? "#e8433a" : "#e9e9ee",
                color: players.length >= 3 ? "#fff" : "#77788a",
                boxShadow: players.length >= 3 ? "4px 4px 0 #16161a" : "none",
                cursor: players.length >= 3 ? "pointer" : "not-allowed",
              }}
              className={space.className}
            >
              {players.length < 3
                ? `NEEDS ${3 - players.length} MORE PLAYER${3 - players.length > 1 ? "S" : ""}`
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

// ─────────────────────────────────────────────
// DISCUSSION VIEW
// ─────────────────────────────────────────────
function DiscussionView({
  currentPlayer,
  isHost,
  sendAction,
}: {
  currentPlayer: Player | undefined;
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
        style={{ fontSize: 11, letterSpacing: "1px", color: "#e8433a", marginBottom: 12 }}
      >
        PHASE · LIVE DISCUSSION
      </div>

      <h2
        className={kalam.className}
        style={{ fontSize: "clamp(1.8rem,4.5vw,2.6rem)", marginBottom: 10, color: "#16161a" }}
      >
        Talk it out.
      </h2>
      <p style={{ color: "#77788a", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
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
            onClick={() => sendAction("NEXT_ROUND")}
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

// ─────────────────────────────────────────────
// RESULTS VIEW
// ─────────────────────────────────────────────
function ResultsView({
  gameState,
  isHost,
  localPlayerId,
  sendAction,
}: {
  gameState: GameState;
  isHost: boolean;
  localPlayerId: string;
  sendAction: (type: string) => void;
}) {
  const gameContinues = gameState.Winner === "NONE";

  return (
    <div style={{ ...cardStyle, maxWidth: 580, transform: "rotate(0.5deg)" }}>
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div
        className={mono.className}
        style={{ fontSize: 11, letterSpacing: "1px", color: "#77788a", marginBottom: 12 }}
      >
        {gameContinues ? "ROUND COMPLETE" : "CASE CLOSED"}
      </div>

      <h2
        className={kalam.className}
        style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", marginBottom: 20, color: "#16161a" }}
      >
        {gameContinues ? "Round Over." : "Game Over."}
      </h2>

      {/* Eliminated player */}
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
        <span className={mono.className} style={{ fontSize: 11, color: "#e8433a" }}>
          ELIMINATED
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#16161a" }}>
          {gameState.LastEliminated}
        </span>
      </div>

      {/* Winner banner */}
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

      {/* Scoreboard */}
      <div style={{ marginBottom: 24 }}>
        <p
          className={mono.className}
          style={{ fontSize: 10, letterSpacing: "1px", color: "#77788a", marginBottom: 10 }}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                        <span className={mono.className} style={{ fontSize: 9, color: "#77788a", marginLeft: 6 }}>
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
                  <span style={{ fontWeight: 700, color: "#8c5cd8", fontSize: 15 }}>
                    {p.score} pts
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {isHost && (
        <button
          onClick={() => sendAction(gameContinues ? "CONTINUE_DISCUSSION" : "NEXT_ROUND")}
          style={btnPrimary}
          className={space.className}
        >
          {gameContinues ? "RESUME DISCUSSION →" : "NEW ROUND →"}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MULTI-DEVICE: REVEAL VIEW
// ─────────────────────────────────────────────
function RevealView({
  currentPlayer,
  isHost,
  sendAction,
}: {
  currentPlayer: Player | undefined;
  isHost: boolean;
  sendAction: (type: string) => void;
}) {
  if (!currentPlayer) return null;

  return (
    <div style={{ ...cardStyle, textAlign: "center", transform: "rotate(-0.5deg)" }}>
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div
        className={mono.className}
        style={{ fontSize: 11, letterSpacing: "1px", color: "#77788a", marginBottom: 16 }}
      >
        EYES ONLY · YOUR SECRET WORD
      </div>

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
              style={{ fontSize: "clamp(2.2rem,8vw,3.5rem)", fontWeight: 700, color: "#e8433a" }}
            >
              {currentPlayer.Word ?? "—"}
            </span>
          </div>
          <button onClick={() => sendAction("MARK_READY")} style={btnPrimary} className={space.className}>
            I MEMORIZED IT ✓
          </button>
        </>
      ) : (
        <p
          className={mono.className}
          style={{ fontSize: 13, color: "#77788a", padding: "30px 0", letterSpacing: "0.5px" }}
        >
          Waiting for all players to confirm...
        </p>
      )}

      {isHost && (
        <button
          onClick={() => sendAction("NEXT_ROUND")}
          style={{ ...btnGhost, marginTop: 20 }}
          className={mono.className}
        >
          Abort Round / Back to Lobby
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MULTI-DEVICE: VOTING VIEW
// ─────────────────────────────────────────────
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
        style={{ fontSize: 11, letterSpacing: "1px", color: "#e8433a", marginBottom: 16 }}
      >
        PHASE · CAST YOUR VOTE
      </div>
      <h2
        className={kalam.className}
        style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", marginBottom: 20, color: "#16161a" }}
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
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Vote locked in.</p>
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
                      border: `1.5px solid ${isSelected ? "#e8433a" : "#e9e9ee"}`,
                      borderLeft: `4px solid ${isSelected ? "#e8433a" : "#e9e9ee"}`,
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
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => sendAction("NEXT_ROUND")}
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

// ─────────────────────────────────────────────
// HOTSEAT: REVEAL VIEW
// ─────────────────────────────────────────────
function RevealViewSingleDevice({
  gameState,
  isHost,
  sendAction,
}: {
  gameState: GameState;
  isHost: boolean;
  sendAction: (type: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);

  const activePlayers = Object.values(gameState.Players)
    .sort((a, b) => a.order - b.order)
    .filter((p) => !p.isDead);
  const currentSeat = activePlayers[currentIndex];

  if (!currentSeat) {
    return (
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <span className="corner-tape a" />
        <h2
          className={kalam.className}
          style={{ fontSize: "1.8rem", marginBottom: 24, color: "#16161a" }}
        >
          All players initialized.
        </h2>
        {isHost && (
          <button onClick={() => sendAction("CONTINUE_DISCUSSION")} style={btnPrimary} className={space.className}>
            BEGIN DISCUSSION →
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, textAlign: "center", transform: "rotate(-0.6deg)" }}>
      <span className="corner-tape a" />
      <span className="corner-tape b" />

      <div
        className={mono.className}
        style={{ fontSize: 11, letterSpacing: "1px", color: "#77788a", marginBottom: 8 }}
      >
        HOTSEAT HANDOFF
      </div>
      <h2
        className={kalam.className}
        style={{ fontSize: "clamp(1.4rem,4vw,2rem)", marginBottom: 24, color: "#16161a" }}
      >
        Pass the device to{" "}
        <span style={{ color: "#8c5cd8" }}>{currentSeat.name}</span>
      </h2>

      {/* Word box */}
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
            style={{ fontSize: "clamp(2rem,7vw,3rem)", fontWeight: 700, color: "#e8433a" }}
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
          onClick={() => { setShowWord(false); setCurrentIndex((c) => c + 1); }}
          style={btnPrimary}
          className={space.className}
        >
          I MEMORIZED IT ✓ — NEXT PLAYER
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
        <button
          onClick={() => sendAction("NEXT_ROUND")}
          style={{ ...btnGhost, marginTop: 20 }}
          className={mono.className}
        >
          Abort Round / Back to Lobby
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// HOTSEAT: VOTING VIEW
// ─────────────────────────────────────────────
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
    <div style={{ ...cardStyle, borderLeft: "5px solid #e8433a", transform: "rotate(0.3deg)" }}>
      <span className="corner-tape a" />

      <div
        className={mono.className}
        style={{ fontSize: 11, letterSpacing: "1px", color: "#e8433a", marginBottom: 16 }}
      >
        PHASE · PUBLIC CONSENSUS VOTE
      </div>
      <h2
        className={kalam.className}
        style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", marginBottom: 8, color: "#16161a" }}
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
                  border: `1.5px solid ${isSelected ? "#e8433a" : "#e9e9ee"}`,
                  borderLeft: `4px solid ${isSelected ? "#e8433a" : "#e9e9ee"}`,
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
            onClick={() => sendAction("FORCE_ELIMINATE", { targetId: selectedId })}
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
              onClick={() => sendAction("NEXT_ROUND")}
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
