"use client";

import { useEffect, useMemo, useState } from "react";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

type LoadingVariant = "page" | "section" | "inline";

type ChangingLoadingStateProps = {
  messages?: string[];
  message?: string;
  intervalMs?: number;
  fullHeight?: boolean;
  variant?: LoadingVariant;
  className?: string;
};

type LoadingButtonContentProps = {
  label?: string;
  className?: string;
};

export function ChangingLoadingState({
  messages,
  message,
  intervalMs = 1400,
  fullHeight = false,
  variant,
  className,
}: ChangingLoadingStateProps) {
  const resolvedVariant = variant ?? (fullHeight ? "page" : "section");

  const normalizedMessages = useMemo(() => {
    if (messages && messages.length > 0) {
      return messages;
    }
    return [message ?? "Loading..."];
  }, [message, messages]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (resolvedVariant === "inline" || normalizedMessages.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % normalizedMessages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, normalizedMessages.length, resolvedVariant]);

  if (resolvedVariant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-current",
          className,
        )}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <span className="animate-spin animation-duration-[1.2s] text-current">
            <LogoIcon className="h-3.5 w-3.5" />
          </span>
        </span>
        <span>{normalizedMessages[0]}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center px-4 py-10",
        resolvedVariant === "page"
          ? "min-h-screen"
          : "min-h-[260px] rounded-xl border bg-card/40",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-background/90 shadow-sm">
          <span className="animate-spin animation-duration-[1.2s] text-primary">
            <LogoIcon className="h-6 w-6" />
          </span>
        </span>
        <p className="text-sm font-medium text-foreground transition-opacity duration-200">
          {normalizedMessages[index % normalizedMessages.length]}
        </p>
      </div>
    </div>
  );
}

export function LoadingButtonContent({
  label = "Loading...",
  className,
}: LoadingButtonContentProps) {
  return (
    <ChangingLoadingState
      variant="inline"
      message={label}
      className={cn("text-inherit", className)}
    />
  );
}
