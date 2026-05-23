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
    <Card
      className={cn(
        "border shadow-none",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {showSidebarToggle && !open ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleSidebar}
                  className="border"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              ) : null}
              {onBack ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onBack}
                  className="border"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : null}
              {eyebrow ? (
                <span className={compactUi.typography.eyebrow}>{eyebrow}</span>
              ) : null}
            </div>

            <div className="flex items-start gap-3">
              {icon ? (
                <div className="hidden rounded-md border p-2 text-foreground sm:flex">
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
                className="rounded-md border p-3"
              >
                <p className={compactUi.typography.eyebrow}>
                  {stat.label}
                </p>
                <div className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
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
