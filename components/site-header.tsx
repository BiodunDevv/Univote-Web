"use client";

import { SidebarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/theme-toggler";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b lg:hidden">
      <div className="flex h-12 w-full items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Button
            className="h-7 w-7"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <SidebarIcon className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-4" />
        </div>
        <AnimatedThemeToggler />
      </div>
    </header>
  );
}
