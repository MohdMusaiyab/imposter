"use client";

import React from "react";
import Link from "next/link";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";
import PencilLogo from "@/app/components/PencilLogo";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RulesPage() {
  return (
    <div
      className={`board ${space.className}`}
      style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}
    >
      <div className="board-lines" />

      <nav className="nav">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
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
              textDecoration: "none",
            }}
          >
            ← BACK TO HOME
          </Link>
        </div>
      </nav>

      <div className={`apb-tag ${mono.className}`}>
        <span className="dot" />
        HOW TO PLAY — THE RULES
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 20px 60px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "680px",
            background: "#fff",
            border: "1.5px solid #16161a",
            padding: "40px 36px",
            boxShadow: "6px 8px 0 #e9e9ee",
            transform: "rotate(-0.5deg)",
            marginBottom: "40px",
          }}
        >
          <span className="corner-tape a" />
          <span className="corner-tape b" />

          <div
            className={`case-num ${mono.className}`}
            style={{ marginBottom: 20 }}
          >
            OFFICIAL RULEBOOK
          </div>

          <h1
            className={kalam.className}
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              marginBottom: 10,
              lineHeight: 1.2,
              color: "#16161a",
            }}
          >
            How to catch a liar.
          </h1>

          <div style={{ color: "#16161a", fontSize: 16, lineHeight: 1.7, marginTop: 32 }}>
            <div style={{ marginBottom: 32 }}>
              <div className={mono.className} style={{ fontSize: 13, color: "#e8433a", fontWeight: 600, letterSpacing: "1px", marginBottom: 8 }}>
                01. THE PREMISE
              </div>
              <p>
                Every player receives a secret word (e.g., &quot;Apple&quot;). However, the Imposter(s) receive a completely different but related word (e.g., &quot;Orange&quot;). The Imposter doesn&apos;t know they are the Imposter, and the Crew doesn&apos;t know who the Imposter is.
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <div className={mono.className} style={{ fontSize: 13, color: "#2f6fe4", fontWeight: 600, letterSpacing: "1px", marginBottom: 8 }}>
                02. THE DISCUSSION
              </div>
              <p>
                There is <strong>no strict time limit</strong>. Take turns describing your word carefully. Say enough to prove to the Crew that you know the secret, but be vague enough that you don&apos;t instantly reveal the word to the Imposter! The Imposter must aggressively bluff to blend in.
              </p>
            </div>

            <div style={{ padding: "20px 24px", background: "#fafafa", borderLeft: "3px solid #16161a", marginBottom: 32 }}>
              <div className={mono.className} style={{ fontSize: 13, color: "#16161a", fontWeight: 600, letterSpacing: "1px", marginBottom: 12 }}>
                📡 MULTI-DEVICE MODE
              </div>
              <p style={{ margin: 0, fontSize: 15, color: "#77788a" }}>
                Every player joins on their own phone using the 6-letter Room Code. Votes are cast secretly on your own device. The Server handles game math and eliminations automatically.
              </p>
            </div>

            <div style={{ padding: "20px 24px", background: "#fafafa", borderLeft: "3px solid #8c5cd8", marginBottom: 32 }}>
              <div className={mono.className} style={{ fontSize: 13, color: "#8c5cd8", fontWeight: 600, letterSpacing: "1px", marginBottom: 12 }}>
                📱 SINGLE-DEVICE (HOTSEAT)
              </div>
              <p style={{ margin: 0, fontSize: 15, color: "#77788a" }}>
                Perfect for offline hangouts. One person acts as the Host. The phone is passed around the room so everyone can secretly view their word. When it&apos;s time to vote, the group argues out loud, comes to a verbal consensus, and the Host executes the elimination.
              </p>
            </div>

            <div>
              <div className={mono.className} style={{ fontSize: 13, color: "#22a866", fontWeight: 600, letterSpacing: "1px", marginBottom: 8 }}>
                03. THE RESOLUTION
              </div>
              <p>
                If the group votes out the Imposter, the <strong>Crew Wins</strong> (+100 points each). If the group votes out an innocent Crewmate, the Imposter survives another round. If the Imposter mathematically equals the Crew, the <strong>Imposter Wins</strong> (+250 points).
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/room/create"
            className={`btn btn-primary ${space.className}`}
          >
            HOST A GAME
          </Link>
          <Link
            href="/room/join"
            className={`btn btn-secondary ${space.className}`}
          >
            JOIN A GAME
          </Link>
        </div>
      </div>
    </div>
  );
}
