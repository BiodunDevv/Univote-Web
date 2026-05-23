"use client";

import { useMemo } from "react";
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
  intervalMs = 450,
  fullHeight = false,
  variant,
  className,
}: ChangingLoadingStateProps) {
  void intervalMs;
  const resolvedVariant = variant ?? (fullHeight ? "page" : "section");

  const normalizedMessages = useMemo(() => {
    if (messages && messages.length > 0) {
      return messages;
    }
    return [message ?? "Loading..."];
  }, [message, messages]);
  const resolvedMessage = normalizedMessages[0];

  if (resolvedVariant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-xs font-medium text-current",
          className,
        )}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <span className="animate-spin [animation-duration:500ms] text-current">
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
        "flex items-center justify-center px-3 py-8",
        resolvedVariant === "page"
          ? "min-h-screen"
          : "min-h-[140px] rounded-xl border",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2.5 text-center">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 shadow-sm">
          <span className="animate-spin [animation-duration:500ms] text-primary">
            <LogoIcon className="h-4.5 w-4.5" />
          </span>
        </span>
        <p className="text-xs font-medium text-foreground" aria-live="polite">
          {resolvedMessage}
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
