"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortalPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

/* Dot-grid texture reused across hero sections */
function HeroDots() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hero-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-dots)" />
    </svg>
  );
}

export function PortalHero({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "animate-slide-up relative overflow-hidden rounded-2xl border px-5 py-5 shadow-none",
        className,
      )}
    >
      <HeroDots />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function PortalSectionHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
          {title}
        </h2>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PortalStatsGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {children}
    </div>
  );
}

export function PortalStackCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-none", className)}>
      {children}
    </div>
  );
}

export function PortalEmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border px-6 py-10 text-center">
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
