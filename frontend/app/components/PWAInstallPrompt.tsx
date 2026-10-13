"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import PWAInstallGuideModal from "./PWAInstallGuideModal";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

interface PWAInstallPromptProps {
  variant?: "dock" | "nav" | "floating-banner";
  className?: string;
}

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDismissedSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem("imposter_pwa_banner_dismissed") === "true";
  } catch {
    return false;
  }
}

function getDismissedServerSnapshot(): boolean {
  return true;
}

export default function PWAInstallPrompt({
  variant = "dock",
  className = "",
}: PWAInstallPromptProps) {
  const {
    isInstallable,
    hasNativePrompt,
    isIOS,
    showGuideModal,
    setShowGuideModal,
    triggerInstall,
  } = usePWAInstall();

  const [dismissedLocally, setDismissedLocally] = useState(false);

  const isStoredDismissed = useSyncExternalStore(
    subscribeToStorage,
    getDismissedSnapshot,
    getDismissedServerSnapshot,
  );

  const isBannerDismissed = isStoredDismissed || dismissedLocally;

  const dismissBanner = () => {
    setDismissedLocally(true);
    try {
      localStorage.setItem("imposter_pwa_banner_dismissed", "true");
    } catch {}
  };

  if (!isInstallable) {
    return null;
  }

  if (variant === "nav") {
    return (
      <>
        <button
          type="button"
          onClick={triggerInstall}
          aria-label="Install Imposter App"
          className={`${mono.className} ${className}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "11px",
            letterSpacing: "0.5px",
            fontWeight: 600,
            padding: "8px 14px",
            backgroundColor: "#16161a",
            color: "#ffffff",
            border: "1px solid #16161a",
            borderRadius: "3px",
            boxShadow: "2px 2px 0 #e8433a",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-1px, -1px)";
            e.currentTarget.style.boxShadow = "3px 3px 0 #e8433a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "2px 2px 0 #e8433a";
          }}
        >
          <svg
            width="14"
            height="14"
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
          INSTALL APP
        </button>

        <PWAInstallGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          isIOS={isIOS}
          onNativeInstall={triggerInstall}
          hasNativePrompt={hasNativePrompt}
        />
      </>
    );
  }

  if (variant === "dock") {
    return (
      <>
        <button
          type="button"
          onClick={triggerInstall}
          className={`btn btn-secondary ${space.className} ${className}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1.5px solid #16161a",
            boxShadow: "4px 4px 0 #e8433a",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e8433a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          DOWNLOAD APP
        </button>

        <PWAInstallGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          isIOS={isIOS}
          onNativeInstall={triggerInstall}
          hasNativePrompt={hasNativePrompt}
        />
      </>
    );
  }

  if (variant === "floating-banner") {
    if (isBannerDismissed) return null;

    return (
      <>
        <aside
          aria-label="App download banner"
          className={space.className}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "20px",
            zIndex: 900,
            maxWidth: "340px",
            backgroundColor: "#ffffff",
            border: "1.5px solid #16161a",
            boxShadow: "4px 4px 0 #16161a",
            borderRadius: "4px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "4px",
              backgroundColor: "#16161a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e8433a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#16161a",
                lineHeight: 1.2,
              }}
            >
              Get Imposter App
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#77788a",
                lineHeight: 1.3,
                marginTop: "2px",
              }}
            >
              Play in full screen with no browser bar
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={triggerInstall}
              className={mono.className}
              style={{
                backgroundColor: "#e8433a",
                color: "#ffffff",
                border: "1px solid #16161a",
                padding: "6px 10px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "1.5px 1.5px 0 #16161a",
              }}
            >
              INSTALL
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss banner"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#77788a",
                fontSize: "16px",
                lineHeight: 1,
                cursor: "pointer",
                padding: "4px",
              }}
            >
              ✕
            </button>
          </div>
        </aside>

        <PWAInstallGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          isIOS={isIOS}
          onNativeInstall={triggerInstall}
          hasNativePrompt={hasNativePrompt}
        />
      </>
    );
  }

  return null;
}
