"use client";

import React, { useState, useEffect, useRef } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import type { ChatMessage, Player } from "@/hooks/useGameSocket";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

interface ChatDrawerProps {
  messages: ChatMessage[];
  currentPlayer?: Player;
  localPlayerId: string;
  phase: string;
  roomId: string;
  onSendMessage: (text: string) => void;
}

export default function ChatDrawer({
  messages = [],
  currentPlayer,
  localPlayerId,
  phase,
  roomId,
  onSendMessage,
}: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [lastReadMsgCount, setLastReadMsgCount] = useState(messages.length);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // If chat is open, mark all current messages as read during render
  if (isOpen && lastReadMsgCount !== messages.length) {
    setLastReadMsgCount(messages.length);
  }

  const unreadCount = isOpen ? 0 : Math.max(0, messages.length - lastReadMsgCount);

  // Check if player is dead and currently in an active round (discussion or voting)
  const isMuted =
    Boolean(currentPlayer?.isDead) &&
    (phase === "DISCUSSION" || phase === "VOTING");

  // Auto-scroll to bottom on new message if open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isMuted) return;

    const trimmed = inputText.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Floating Toggle Button (visible when drawer is collapsed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setLastReadMsgCount(messages.length);
          }}
          className={space.className}
          style={{
            position: "fixed",
            bottom: "max(16px, env(safe-area-inset-bottom))",
            right: "max(16px, env(safe-area-inset-right))",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#16161a",
            color: "#ffffff",
            border: "1.5px solid #16161a",
            borderRadius: 4,
            boxShadow: "3px 3px 0 #e8433a",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.5px",
            touchAction: "manipulation",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-1px, -1px)";
            e.currentTarget.style.boxShadow = "4px 4px 0 #e8433a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "3px 3px 0 #e8433a";
          }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          <span>CHAT & DISCUSS</span>
          {unreadCount > 0 && (
            <span
              className={mono.className}
              style={{
                background: "#e8433a",
                color: "#ffffff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 10,
                marginLeft: 2,
                animation: "pulse 1.2s infinite ease-in-out",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-out / Floating Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "max(12px, env(safe-area-inset-bottom))",
            right: "max(12px, env(safe-area-inset-right))",
            width: "min(380px, calc(100vw - 24px))",
            height: "min(520px, calc(100svh - 80px))",
            zIndex: 100,
            background: "#ffffff",
            border: "2px solid #16161a",
            borderRadius: 4,
            boxShadow: "6px 6px 0 #16161a",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeInUp 0.18s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 14px",
              background: "#16161a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1.5px solid #16161a",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <div>
                <div
                  className={space.className}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    lineHeight: 1.1,
                  }}
                >
                  ROOM CHAT · #{roomId}
                </div>
                <div
                  className={mono.className}
                  style={{ fontSize: 9.5, color: "#a0a0ab", marginTop: 2 }}
                >
                  DISCUSS &amp; DROP CLUES
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={mono.className}
              title="Close Chat"
              style={{
                background: "transparent",
                border: "1px solid #444",
                color: "#ffffff",
                borderRadius: 3,
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 12px",
              background: "#fafafa",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  padding: "20px 10px",
                  color: "#77788a",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>💬</div>
                <div
                  className={mono.className}
                  style={{ fontSize: 11, fontWeight: 600, color: "#16161a" }}
                >
                  NO MESSAGES YET
                </div>
                <div
                  className={mono.className}
                  style={{ fontSize: 10, color: "#77788a", marginTop: 4 }}
                >
                  Chat with other players here. Drop clues, defend yourself, or discuss who the imposter is!
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === localPlayerId;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                      maxWidth: "88%",
                      alignSelf: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    {/* Sender Name & Timestamp */}
                    <div
                      className={mono.className}
                      style={{
                        fontSize: 9.5,
                        color: "#77788a",
                        marginBottom: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: isMe ? "#16161a" : "#444" }}>
                        {isMe ? "YOU" : msg.senderName}
                      </span>
                      <span>·</span>
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        padding: "8px 12px",
                        background: isMe ? "#fff8e6" : "#ffffff",
                        color: "#16161a",
                        border: `1.5px solid ${isMe ? "#f0b429" : "#e9e9ee"}`,
                        borderRadius: 3,
                        boxShadow: `1.5px 1.5px 0 ${isMe ? "#f0b429" : "#e9e9ee"}`,
                        fontSize: 13,
                        lineHeight: 1.35,
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Muted Warning (if eliminated during discussion/voting) */}
          {isMuted ? (
            <div
              className={mono.className}
              style={{
                padding: "10px 12px",
                background: "#fff0ef",
                borderTop: "1.5px solid #e8433a",
                fontSize: 10.5,
                color: "#e8433a",
                lineHeight: 1.3,
                textAlign: "center",
              }}
            >
              🔇 <strong>SPECTATOR MODE:</strong> You are eliminated and muted
              during active rounds to prevent word spoilers.
            </div>
          ) : (
            /* Input Bar */
            <form
              onSubmit={handleSend}
              style={{
                padding: "10px 12px",
                background: "#ffffff",
                borderTop: "1.5px solid #e9e9ee",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, 200))}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your clue or message..."
                  maxLength={200}
                  style={{
                    flex: 1,
                    padding: "9px 11px",
                    fontSize: 16, // 16px prevents iOS Safari from auto-zooming viewport
                    border: "1.5px solid #16161a",
                    borderRadius: 3,
                    outline: "none",
                    background: "#fafafa",
                    color: "#16161a",
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={mono.className}
                  style={{
                    padding: "8px 12px",
                    background: inputText.trim() ? "#e8433a" : "#e9e9ee",
                    color: inputText.trim() ? "#ffffff" : "#77788a",
                    border: "1.5px solid",
                    borderColor: inputText.trim() ? "#e8433a" : "#e9e9ee",
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: inputText.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  SEND ↵
                </button>
              </div>

              <div
                className={mono.className}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 9.5,
                  color: "#77788a",
                  padding: "0 2px",
                }}
              >
                <span>Press Enter to send</span>
                <span>{inputText.length}/200</span>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
