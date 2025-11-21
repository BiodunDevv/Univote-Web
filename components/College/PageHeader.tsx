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
  showSidebarToggle = true,
}: PageHeaderProps) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <div className="md:sticky md:top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {showSidebarToggle && !open && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="rounded-full hover:bg-accent h-8 w-8 shrink-0"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="rounded-full hover:bg-accent h-8 w-8 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`text-sm md:text-lg font-semibold text-foreground truncate ${
                    hideTitleOnMobile ? "hidden md:block" : ""
                  }`}
                >
                  {title}
                </h1>
                {badges}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex flex-row gap-2 shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
