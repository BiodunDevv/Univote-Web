"use client";

import * as React from "react";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { compactUi } from "@/lib/compact-ui";

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

export function TenantPageHeader({
  title,
  subtitle,
  eyebrow = "Tenant workspace",
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
    <Card
      className={cn(
        "overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--muted))_0%,transparent_42%),linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--card))_55%,hsl(var(--muted)/0.22)_100%)] shadow-none py-2 p-2",
        className,
      )}
    >
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className={cn("flex flex-wrap items-center gap-2", compactUi.typography.eyebrow)}>
              {showSidebarToggle && !open ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleSidebar}
                  className="rounded-full border border-border/70"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              ) : null}
              {onBack ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onBack}
                  className="rounded-full border border-border/70"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <span>{eyebrow}</span>
            </div>

            <div className="flex items-start gap-3">
              {icon ? (
                <div className="hidden rounded-2xl border border-border/70 bg-background/80 p-2 text-foreground shadow-sm sm:flex">
                  {icon}
                </div>
              ) : null}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className={cn(
                      compactUi.typography.pageTitle,
                      hideTitleOnMobile && "hidden md:block",
                    )}
                  >
                    {title}
                  </h1>
                  {badges}
                </div>
                {subtitle ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>

        {stats?.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/70 bg-background/75 p-4 shadow-sm"
              >
                <p className={compactUi.typography.eyebrow}>
                  {stat.label}
                </p>
                <div className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
