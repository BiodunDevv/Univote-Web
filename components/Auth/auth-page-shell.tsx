"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  children: ReactNode;
  backHref: string;
  backLabel: string;
  align?: "center" | "start";
  maxWidthClassName?: string;
  contentClassName?: string;
  className?: string;
};

export function AuthPageShell({
  children,
  backHref,
  backLabel,
  align = "center",
  maxWidthClassName = "max-w-sm",
  contentClassName,
  className,
}: AuthPageShellProps) {
  const patternId = useId().replace(/:/g, "");

  return (
    <div
      className={cn(
        "relative min-h-svh overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[30rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/12" />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035] dark:opacity-[0.055]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`auth-dot-pattern-${patternId}`}
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#auth-dot-pattern-${patternId})`} />
      </svg>

      <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" />
      </div>

      <div
        className={cn(
          "relative z-10 flex min-h-[calc(100svh-4rem)] justify-center px-4 py-8 sm:px-6",
          align === "center" ? "items-center" : "items-start",
          contentClassName,
        )}
      >
        <div className={cn("w-full", maxWidthClassName)}>{children}</div>
      </div>
    </div>
  );
}
