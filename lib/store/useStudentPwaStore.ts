"use client";

import { create } from "zustand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type StudentPwaState = {
  installPromptEvent: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isMobileCapable: boolean;
  isPrompting: boolean;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  setInstalled: (installed: boolean) => void;
  setMobileCapable: (isMobileCapable: boolean) => void;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export const useStudentPwaStore = create<StudentPwaState>((set, get) => ({
  installPromptEvent: null,
  isInstalled: false,
  isMobileCapable: false,
  isPrompting: false,
  setInstallPromptEvent: (event) => set({ installPromptEvent: event }),
  setInstalled: (installed) =>
    set({
      isInstalled: installed || isStandaloneMode(),
      installPromptEvent: installed ? null : get().installPromptEvent,
    }),
  setMobileCapable: (isMobileCapable) => set({ isMobileCapable }),
  promptInstall: async () => {
    const installPromptEvent = get().installPromptEvent;

    if (!installPromptEvent?.prompt) {
      return "unavailable";
    }

    set({ isPrompting: true });

    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      if (choice.outcome === "accepted") {
        set({
          isInstalled: true,
          installPromptEvent: null,
          isPrompting: false,
        });
        return "accepted";
      }

      set({ isPrompting: false });
      return "dismissed";
    } catch {
      set({ isPrompting: false });
      return "unavailable";
    }
  },
}));

export function useStudentPwaInstallState() {
  const installPromptEvent = useStudentPwaStore(
    (state) => state.installPromptEvent,
  );
  const isInstalled = useStudentPwaStore((state) => state.isInstalled);
  const isMobileCapable = useStudentPwaStore((state) => state.isMobileCapable);
  const isPrompting = useStudentPwaStore((state) => state.isPrompting);
  const promptInstall = useStudentPwaStore((state) => state.promptInstall);

  return {
    isInstalled,
    isMobileCapable,
    isPrompting,
    canInstall: isMobileCapable && !isInstalled && Boolean(installPromptEvent),
    promptInstall,
  };
}
