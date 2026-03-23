"use client";

import * as React from "react";
import { compactUi } from "@/lib/compact-ui";
import { cn } from "@/lib/utils";

export function PortalPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
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
        "rounded-2xl border bg-linear-to-br from-card via-card to-muted/30 p-3 shadow-none",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? (
            <div className={compactUi.typography.eyebrow}>{eyebrow}</div>
          ) : null}
          <h1 className={compactUi.typography.pageTitle}>{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function PortalSectionHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h2 className={compactUi.typography.sectionTitle}>{title}</h2>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
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
    <div
      className={cn("rounded-2xl border bg-card p-3 shadow-none", className)}
    >
      {children}
    </div>
  );
}

export function PortalEmptyState({
  title,
  description,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <PortalStackCard className="space-y-1.5">
      <p className={compactUi.typography.cardTitle}>{title}</p>
      <p className="text-sm leading-5 text-muted-foreground">{description}</p>
    </PortalStackCard>
  );
}
