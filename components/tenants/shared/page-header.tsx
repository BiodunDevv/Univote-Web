"use client";

import * as React from "react";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

type HeaderStat = {
  label: string;
  value: React.ReactNode;
};

interface TenantPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  stats?: HeaderStat[];
  hideTitleOnMobile?: boolean;
  showSidebarToggle?: boolean;
  className?: string;
}

function HeaderDots() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="admin-header-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#admin-header-dots)" />
    </svg>
  );
}

export function TenantPageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  onBack,
  actions,
  badges,
  stats,
  hideTitleOnMobile = false,
  showSidebarToggle = false,
  className,
}: TenantPageHeaderProps) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <div className={cn("relative overflow-hidden rounded-xl border px-5 py-4 shadow-none", className)}>
      <HeaderDots />
      <div className="relative flex flex-col gap-4">
        {/* Top bar: nav + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {/* Breadcrumb row */}
            <div className="flex flex-wrap items-center gap-2">
              {showSidebarToggle && !open ? (
                <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} className="border">
                  <Menu className="h-4 w-4" />
                </Button>
              ) : null}
              {onBack ? (
                <Button variant="ghost" size="icon-sm" onClick={onBack} className="border">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : null}
              {eyebrow ? (
                <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {eyebrow}
                </span>
              ) : null}
            </div>

            {/* Title row */}
            <div className="flex items-center gap-2.5">
              {icon ? (
                <div className="hidden shrink-0 rounded-md border bg-muted/30 p-1.5 text-foreground sm:flex">
                  {icon}
                </div>
              ) : null}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className={cn(
                      "text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl",
                      hideTitleOnMobile && "hidden md:block",
                    )}
                  >
                    {title}
                  </h1>
                  {badges}
                </div>
                {subtitle ? (
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 pt-0.5">{actions}</div>
          ) : null}
        </div>

        {/* Stats row */}
        {stats?.length ? (
          <div className="flex flex-wrap gap-px rounded-lg border overflow-hidden">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-1 flex-col gap-0.5 px-4 py-2.5 min-w-[100px]"
              >
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
                <span className="text-base font-semibold tracking-tight text-foreground">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
