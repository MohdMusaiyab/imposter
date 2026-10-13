"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPromptInstance: BeforeInstallPromptEvent | null = null;
const promptSubscribers = new Set<() => void>();

function notifyPromptSubscribers() {
  promptSubscribers.forEach((callback) => callback());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPromptInstance = event;
    notifyPromptSubscribers();
  });

  window.addEventListener("appinstalled", () => {
    deferredPromptInstance = null;
    notifyPromptSubscribers();
  });
}

function subscribeToInstallPrompt(callback: () => void) {
  promptSubscribers.add(callback);
  return () => {
    promptSubscribers.delete(callback);
  };
}

function getPromptSnapshot(): BeforeInstallPromptEvent | null {
  return deferredPromptInstance;
}

function getPromptServerSnapshot(): null {
  return null;
}

function subscribeToStandalone(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    mediaQuery.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const isStandaloneMedia = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  const isIOSStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
    true;
  return isStandaloneMedia || isIOSStandalone;
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

function subscribeStatic() {
  return () => {};
}

function getIOSSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(ua) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

function getIOSServerSnapshot(): boolean {
  return false;
}

export function usePWAInstall() {
  const [showGuideModal, setShowGuideModal] = useState(false);

  const currentPrompt = useSyncExternalStore(
    subscribeToInstallPrompt,
    getPromptSnapshot,
    getPromptServerSnapshot,
  );

  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot,
  );

  const isIOS = useSyncExternalStore(
    subscribeStatic,
    getIOSSnapshot,
    getIOSServerSnapshot,
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered in scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPromptInstance) {
      try {
        await deferredPromptInstance.prompt();
        const choice = await deferredPromptInstance.userChoice;
        if (choice.outcome === "accepted") {
          deferredPromptInstance = null;
          notifyPromptSubscribers();
        }
      } catch (err) {
        console.error("[PWA] Error launching install prompt:", err);
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  }, []);

  const isInstallable = !isStandalone;

  return {
    isInstallable,
    hasNativePrompt: !!currentPrompt,
    isInstalled: isStandalone,
    isIOS,
    showGuideModal,
    setShowGuideModal,
    triggerInstall,
  };
}
