"use client";

import React, { useEffect } from "react";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onNativeInstall?: () => void;
  hasNativePrompt?: boolean;
}

export default function PWAInstallGuideModal({
  isOpen,
  onClose,
  isIOS,
  onNativeInstall,
  hasNativePrompt,
}: PWAInstallGuideModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(22, 22, 26, 0.65)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={space.className}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#ffffff",
          border: "2px solid #16161a",
          boxShadow: "6px 8px 0 #16161a",
          padding: "28px 24px 24px",
          borderRadius: "4px",
          animation: "scaleIn 0.2s ease-out",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%) rotate(-1deg)",
            width: "80px",
            height: "22px",
            background: "rgba(235, 230, 215, 0.85)",
            border: "1px dashed #c0bca8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />

        <button
          onClick={onClose}
          aria-label="Close installation guide"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "32px",
            height: "32px",
            borderRadius: "3px",
            border: "1.5px solid #16161a",
            background: "#fafafa",
            fontSize: "18px",
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "#16161a",
          }}
        >
          ✕
        </button>

        <div
          className={mono.className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            letterSpacing: "1px",
            color: "#e8433a",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#e8433a",
            }}
          />
          DOWNLOAD CASE FILE · PWA
        </div>

        <h2
          id="pwa-install-title"
          className={kalam.className}
          style={{
            fontSize: "26px",
            lineHeight: 1.2,
            color: "#16161a",
            marginBottom: "8px",
          }}
        >
          Install Imposter on Your Device
        </h2>

        <p
          style={{
            fontSize: "13.5px",
            color: "#77788a",
            lineHeight: 1.5,
            marginBottom: "20px",
          }}
        >
          Get full-screen deduction without browser tabs, faster load times, and
          instant access from your home screen.
        </p>

        {hasNativePrompt && onNativeInstall && (
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              style={{
                width: "100%",
                padding: "13px 20px",
                backgroundColor: "#e8433a",
                color: "#ffffff",
                border: "1.5px solid #16161a",
                boxShadow: "3px 4px 0 #16161a",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              INSTALL NOW (ONE CLICK)
            </button>
            <div
              className={mono.className}
              style={{
                textAlign: "center",
                fontSize: "10px",
                color: "#77788a",
                marginTop: "8px",
              }}
            >
              — or follow the steps below —
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#f7f7f9",
            border: "1px solid #e9e9ee",
            borderRadius: "4px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          {isIOS ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span
                  className={mono.className}
                  style={{
                    backgroundColor: "#16161a",
                    color: "#ffffff",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                <div style={{ fontSize: "13px", color: "#16161a" }}>
                  Tap the <strong>Share</strong> button{" "}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      background: "#fff",
                      border: "1px solid #d4d4dc",
                      borderRadius: "3px",
                      fontSize: "12px",
                    }}
                  >
                    ⎋
                  </span>{" "}
                  in the Safari toolbar at the bottom or top.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span
                  className={mono.className}
                  style={{
                    backgroundColor: "#16161a",
                    color: "#ffffff",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                <div style={{ fontSize: "13px", color: "#16161a" }}>
                  Scroll down the share sheet and tap{" "}
                  <strong>&quot;Add to Home Screen&quot;</strong>{" "}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      background: "#fff",
                      border: "1px solid #d4d4dc",
                      borderRadius: "3px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    ➕
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span
                  className={mono.className}
                  style={{
                    backgroundColor: "#16161a",
                    color: "#ffffff",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  3
                </span>
                <div style={{ fontSize: "13px", color: "#16161a" }}>
                  Tap <strong>&quot;Add&quot;</strong> in the top right. Done!
                  Launch Imposter straight from your home screen.
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span
                  className={mono.className}
                  style={{
                    backgroundColor: "#16161a",
                    color: "#ffffff",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                <div style={{ fontSize: "13px", color: "#16161a" }}>
                  Tap the browser menu{" "}
                  <strong
                    style={{
                      padding: "2px 6px",
                      background: "#fff",
                      border: "1px solid #d4d4dc",
                      borderRadius: "3px",
                    }}
                  >
                    ⋮
                  </strong>{" "}
                  or the install icon in the address bar.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span
                  className={mono.className}
                  style={{
                    backgroundColor: "#16161a",
                    color: "#ffffff",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                <div style={{ fontSize: "13px", color: "#16161a" }}>
                  Select <strong>&quot;Install app&quot;</strong> or{" "}
                  <strong>&quot;Add to Home screen&quot;</strong>.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span
                  className={mono.className}
                  style={{
                    backgroundColor: "#16161a",
                    color: "#ffffff",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  3
                </span>
                <div style={{ fontSize: "13px", color: "#16161a" }}>
                  Confirm install. Imposter will now appear on your home screen
                  &amp; app list!
                </div>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            className={mono.className}
            style={{ fontSize: "10.5px", color: "#77788a" }}
          >
            FREE · NO APP STORE REQUIRED · NO DOWNLOAD SIZE
          </span>
          <button
            onClick={onClose}
            className={mono.className}
            style={{
              padding: "7px 14px",
              backgroundColor: "#16161a",
              color: "#ffffff",
              border: "1px solid #16161a",
              borderRadius: "3px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              cursor: "pointer",
            }}
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
