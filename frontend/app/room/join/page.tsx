"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PencilLogo from "@/app/components/PencilLogo";
import Link from "next/link";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"] });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function JoinRoom() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;

    const formattedCode = roomCode.trim().toUpperCase();
    const sessionData = {
      playerId: crypto.randomUUID(),
      name: playerName.trim(),
      roomId: formattedCode,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    localStorage.setItem("imposter_session", JSON.stringify(sessionData));
    router.push(`/room/${formattedCode}`);
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    background: "#fafafa",
    border: "1.5px solid #e9e9ee",
    outline: "none",
    borderRadius: 3,
    color: "#16161a",
    transition: "border-color .2s",
    letterSpacing: "0.5px",
  };

  return (
    <div
      className={`board ${space.className}`}
      style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}
    >
      <div className="board-lines" />

      <nav className="nav">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <PencilLogo />
          <Link
            href="/"
            className={mono.className}
            style={{
              fontSize: 11,
              color: "#77788a",
              letterSpacing: "0.5px",
              borderBottom: "1px dashed #77788a",
              paddingBottom: 2,
              textDecoration: "none"
            }}
          >
            ← BACK TO HOME
          </Link>
        </div>
      </nav>

      <div className={`apb-tag ${mono.className}`}>
        <span className="dot" />
        FIELD AGENT ENTRY — JOIN A GAME
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px 60px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "480px",
            background: "#fff",
            border: "1.5px solid #16161a",
            padding: "36px 32px 32px",
            boxShadow: "6px 8px 0 #e9e9ee",
            transform: "rotate(0.5deg)",
          }}
        >
          <span className="corner-tape a" />
          <span className="corner-tape b" />

          <div className={`case-num ${mono.className}`} style={{ marginBottom: 20 }}>
            FORM B-1 · JOIN ROOM
          </div>

          <h1
            className={kalam.className}
            style={{ fontSize: "clamp(1.7rem, 5vw, 2.4rem)", marginBottom: 6, lineHeight: 1.2 }}
          >
            Join a Game
          </h1>
          <p
            className={mono.className}
            style={{ fontSize: 13, color: "#77788a", marginBottom: 28 }}
          >
            Enter the room code and your alias to join.
          </p>

          <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label
                className={mono.className}
                style={{ display: "block", fontSize: 11, letterSpacing: "0.8px", color: "#77788a", marginBottom: 8 }}
              >
                ROOM CODE
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. XYZ123"
                required
                maxLength={10}
                style={{ ...fieldStyle, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "3px", fontSize: 18 }}
                onFocus={(e) => (e.target.style.borderColor = "#e8433a")}
                onBlur={(e) => (e.target.style.borderColor = "#e9e9ee")}
              />
            </div>

            <div>
              <label
                className={mono.className}
                style={{ display: "block", fontSize: 11, letterSpacing: "0.8px", color: "#77788a", marginBottom: 8 }}
              >
                YOUR ALIAS
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Maverick"
                required
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#e8433a")}
                onBlur={(e) => (e.target.style.borderColor = "#e9e9ee")}
              />
            </div>

            <button
              type="submit"
              className={space.className}
              style={{
                marginTop: 8,
                padding: "15px 28px",
                fontSize: 15,
                fontWeight: 700,
                background: "#e8433a",
                color: "#fff",
                border: "1.5px solid #e8433a",
                boxShadow: "4px 4px 0 #16161a",
                borderRadius: 3,
                cursor: "pointer",
                transition: "all .18s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0 #16161a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0 #16161a";
              }}
            >
              ENTER THE ROOM →
            </button>
          </form>

          {/* Divider + create link */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e9e9ee", textAlign: "center" }}>
            <span className={mono.className} style={{ fontSize: 11, color: "#77788a" }}>
              DON&apos;T HAVE A CODE?{" "}
            </span>
            <Link
              href="/room/create"
              className={mono.className}
              style={{
                fontSize: 11,
                color: "#e8433a",
                borderBottom: "1px solid #e8433a",
                paddingBottom: 1,
                letterSpacing: "0.5px",
              }}
            >
              HOST A GAME
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
