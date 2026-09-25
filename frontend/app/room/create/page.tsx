"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"] });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function CreateRoom() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSingleDevice, setIsSingleDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setLoading(true);
    setErr("");

    try {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname.startsWith("192.168.");
      const httpBaseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (isLocal
          ? `http://${window.location.hostname}:9999`
          : "https://imposter-54yr.onrender.com");

      const response = await fetch(`${httpBaseUrl}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPrivate: isSingleDevice ? true : isPrivate,
          isSingleDevice,
        }),
      });

      if (!response.ok) {
        setErr("Failed to create room. Please try again.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      const actualRoomId = data.roomId;

      const sessionData = {
        playerId: crypto.randomUUID(),
        name: playerName.trim(),
        roomId: actualRoomId,
        isSingleDevice,
        isPrivate: isSingleDevice ? true : isPrivate,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      localStorage.setItem("imposter_session", JSON.stringify(sessionData));
      router.push(`/room/${actualRoomId}`);
    } catch {
      setErr("Could not reach the server. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <div
      className={`board ${space.className}`}
      style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}
    >
      {/* Grid background */}
      <div className="board-lines" />

      {/* Nav */}
      <nav className="nav">
        <div className="logo">
          <span className={`badge-icon ${mono.className}`}>3</span>
          IMPOSTER
        </div>
        <Link href="/" className={`nav-cta ${mono.className}`}>
          ← HOME
        </Link>
      </nav>

      {/* APB tag */}
      <div className={`apb-tag ${mono.className}`}>
        <span className="dot" />
        INCIDENT REPORT — OPEN A NEW CASE
      </div>

      {/* Form card */}
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
            maxWidth: "520px",
            background: "#fff",
            border: "1.5px solid #16161a",
            padding: "36px 32px 32px",
            boxShadow: "6px 8px 0 #e9e9ee",
            transform: "rotate(-0.5deg)",
          }}
        >
          {/* Corner tapes */}
          <span className="corner-tape a" />
          <span className="corner-tape b" />

          {/* Case label */}
          <div className={`case-num ${mono.className}`} style={{ marginBottom: 20 }}>
            FORM A-1 · CREATE ROOM
          </div>

          <h1
            className={kalam.className}
            style={{ fontSize: "clamp(1.7rem, 5vw, 2.4rem)", marginBottom: 6, lineHeight: 1.2 }}
          >
            Open a New Case
          </h1>
          <p
            className={mono.className}
            style={{ fontSize: 13, color: "#77788a", marginBottom: 28 }}
          >
            Configure your room. Players will join using the case code.
          </p>

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Player name */}
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
                style={{
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
                }}
                onFocus={(e) => (e.target.style.borderColor = "#e8433a")}
                onBlur={(e) => (e.target.style.borderColor = "#e9e9ee")}
              />
            </div>

            {/* Device mode */}
            <div>
              <label
                className={mono.className}
                style={{ display: "block", fontSize: 11, letterSpacing: "0.8px", color: "#77788a", marginBottom: 8 }}
              >
                DEVICE MODE
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "📡 Multi-Device", val: false },
                  { label: "📱 Single Device", val: true },
                ].map(({ label, val }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsSingleDevice(val)}
                    style={{
                      padding: "12px 8px",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      border: "1.5px solid",
                      borderColor: isSingleDevice === val ? "#16161a" : "#e9e9ee",
                      background: isSingleDevice === val ? "#16161a" : "#fff",
                      color: isSingleDevice === val ? "#fff" : "#77788a",
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all .18s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p
                className={mono.className}
                style={{ fontSize: 11, color: "#77788a", marginTop: 8 }}
              >
                {isSingleDevice
                  ? "Pass the phone around. Great for playing together in person."
                  : "Everyone joins from their own device using the room code."}
              </p>
            </div>

            {/* Room visibility (multi-device only) */}
            {!isSingleDevice && (
              <div style={{ borderTop: "1px solid #e9e9ee", paddingTop: 18 }}>
                <label
                  className={mono.className}
                  style={{ display: "block", fontSize: 11, letterSpacing: "0.8px", color: "#77788a", marginBottom: 8 }}
                >
                  ROOM VISIBILITY
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Public", val: false },
                    { label: "Private", val: true },
                  ].map(({ label, val }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setIsPrivate(val)}
                      style={{
                        padding: "12px 8px",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        border: "1.5px solid",
                        borderColor: isPrivate === val ? "#e8433a" : "#e9e9ee",
                        background: isPrivate === val ? "#e8433a" : "#fff",
                        color: isPrivate === val ? "#fff" : "#77788a",
                        borderRadius: 3,
                        cursor: "pointer",
                        transition: "all .18s",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p
                  className={mono.className}
                  style={{ fontSize: 11, color: "#77788a", marginTop: 8 }}
                >
                  {isPrivate
                    ? "Only players with the secret code can join."
                    : "Anyone can discover and join this room."}
                </p>
              </div>
            )}

            {err && (
              <p
                className={mono.className}
                style={{ fontSize: 12, color: "#e8433a", padding: "8px 12px", border: "1px solid #e8433a", borderRadius: 3 }}
              >
                {err}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={space.className}
              style={{
                marginTop: 8,
                padding: "15px 28px",
                fontSize: 15,
                fontWeight: 700,
                background: loading ? "#e9e9ee" : "#e8433a",
                color: loading ? "#77788a" : "#fff",
                border: "1.5px solid",
                borderColor: loading ? "#e9e9ee" : "#e8433a",
                boxShadow: loading ? "none" : "4px 4px 0 #16161a",
                borderRadius: 3,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all .18s",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0 #16161a";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? "none" : "4px 4px 0 #16161a";
              }}
            >
              {loading ? "OPENING CASE..." : "OPEN THE CASE →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
