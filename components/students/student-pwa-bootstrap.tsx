"use client";

import { useEffect } from "react";
import { useStudentPwaStore } from "@/lib/store/useStudentPwaStore";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectMobileCapableEnvironment() {
  if (typeof window === "undefined") {
    return false;
  }

  const touchCapable =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.("(pointer: coarse)")?.matches;
  const mobileViewport = window.innerWidth < 1024;

  return touchCapable || mobileViewport;
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function StudentPwaBootstrap() {
  const setInstallPromptEvent = useStudentPwaStore(
    (state) => state.setInstallPromptEvent,
  );
  const setInstalled = useStudentPwaStore((state) => state.setInstalled);
  const setMobileCapable = useStudentPwaStore(
    (state) => state.setMobileCapable,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateCapabilities = () => {
      setMobileCapable(detectMobileCapableEnvironment());
      setInstalled(isStandaloneMode());
    };

    updateCapabilities();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      updateCapabilities();
    };

    const handleInstalled = () => {
      setInstallPromptEvent(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("resize", updateCapabilities);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("resize", updateCapabilities);
    };
  }, [setInstallPromptEvent, setInstalled, setMobileCapable]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker
      .register("/student-portal-sw.js", {
        scope: "/students",
      })
      .catch((error) => {
        console.error("Student portal service worker registration failed:", error);
      });
  }, []);

  return null;
}
