"use client";

import { Moon, SunDim } from "lucide-react";
import {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  className?: string;
  variant?: "icon-only" | "with-text" | "header";
  enableShortcut?: boolean;
  shortcutLabel?: string;
};

export const AnimatedThemeToggler = ({
  className,
  variant = "icon-only",
  enableShortcut = false,
  shortcutLabel,
}: Props) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const isDarkMode = (resolvedTheme ?? theme) === "dark";
  const computedShortcutLabel = useMemo(() => {
    if (shortcutLabel) return shortcutLabel;
    if (typeof navigator === "undefined") return "Ctrl+D";

    const isMac = /Mac|iPhone|iPad|iPod/i.test(
      navigator.userAgent || navigator.platform,
    );

    return isMac ? "⌘D" : "Ctrl+D";
  }, [shortcutLabel]);

  const changeTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = isDarkMode ? "light" : "dark";

    // Check if we're in a browser environment and if View Transitions API is supported
    if (
      typeof window === "undefined" ||
      typeof document === "undefined" ||
      !document.startViewTransition
    ) {
      setTheme(newTheme);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, [isDarkMode, setTheme]);

  useEffect(() => {
    if (!mounted || !enableShortcut) return;

    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isEditable) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        void changeTheme();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [changeTheme, enableShortcut, mounted]);

  // Don't render anything until the component has mounted on the client
  if (!mounted) {
    return null;
  }

  if (variant === "header") {
    return (
      <Button
        ref={buttonRef}
        type="button"
        onClick={() => void changeTheme()}
        variant="outline"
        size="sm"
        className={cn("h-9 gap-2", className)}
        aria-label={`Toggle theme (${computedShortcutLabel})`}
        title={`Toggle theme (${computedShortcutLabel})`}
      >
        <span className="relative inline-flex size-4 items-center justify-center">
          <SunDim className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </span>
        <span className="hidden text-sm sm:inline">
          {isDarkMode ? "Dark" : "Light"}
        </span>
        <Badge
          variant="outline"
          className="hidden rounded-md px-1.5 py-0 text-[10px] md:inline-flex"
        >
          {computedShortcutLabel}
        </Badge>
      </Button>
    );
  }

  if (variant === "with-text") {
    return (
      <Button
        ref={buttonRef}
        type="button"
        onClick={() => void changeTheme()}
        variant="ghost"
        className={cn("w-full justify-start", className)}
        aria-label="Toggle theme"
      >
        <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
          <SunDim className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </span>
        <span>{isDarkMode ? "Dark mode" : "Light mode"}</span>
      </Button>
    );
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      onClick={() => void changeTheme()}
      variant="outline"
      size="icon"
      className={cn("relative", className)}
      aria-label="Toggle theme"
    >
      <SunDim className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
