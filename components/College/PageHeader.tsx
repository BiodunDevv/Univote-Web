"use client";

import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  hideTitleOnMobile?: boolean;
  showSidebarToggle?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  actions,
  badges,
  hideTitleOnMobile = false,
  showSidebarToggle = false,
}: PageHeaderProps) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="rounded-xl border bg-card/60 p-4 shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {showSidebarToggle && !open && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 shrink-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`truncate text-xl font-semibold text-foreground ${
                    hideTitleOnMobile ? "hidden md:block" : ""
                  }`}
                >
                  {title}
                </h1>
                {badges}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
