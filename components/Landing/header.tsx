"use client";

import Link from "next/link";
import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { AnimatedThemeToggler } from "../theme-toggler";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Features", href: "/#features" },
  { name: "Stories", href: "/#stories" },
  { name: "Application", href: "/tenant-application" },
];

export const HeroHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const {
    token,
    admin,
    hasHydrated: adminHasHydrated,
  } = useAuthStore();
  const { token: studentToken, hasHydrated: participantHasHydrated } =
    useStudentAuthStore();
  const isCheckingSession =
    !mounted || !adminHasHydrated || !participantHasHydrated;
  const isTenantAuthenticated =
    Boolean(token) && admin?.role !== "super_admin";
  const activeHref = token
    ? admin?.role === "super_admin"
      ? "/super-admin"
      : "/dashboard"
    : studentToken
      ? "/students/home"
      : null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 p-2 sm:p-3">
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            "rounded-2xl border border-transparent px-3 py-2 transition-all duration-300 ease-out sm:px-4",
            isScrolled
              ? "border-border/50 bg-background/40 shadow-lg shadow-black/5 backdrop-blur-2xl"
              : "bg-transparent",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-5">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold"
              >
                <Logo />
              </Link>
              <nav className="hidden items-center gap-5 md:flex">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              {isCheckingSession ? (
                <>
                  <Skeleton className="hidden h-9 w-32 rounded-md md:block" />
                  <Skeleton className="hidden size-9 rounded-md md:block" />
                </>
              ) : activeHref ? (
                <Button
                  variant="outline"
                  asChild
                  className="hidden transition-transform md:inline-flex"
                  size="sm"
                >
                  <Link href={activeHref}>
                    {token ? "Platform Console" : "Portal"}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    asChild
                    className="hidden transition-transform md:inline-flex"
                    size="sm"
                  >
                    <Link href="/application-status">Review Application</Link>
                  </Button>
                  <Button
                    asChild
                    className="hidden transition-transform md:inline-flex"
                    size="sm"
                  >
                    <Link href="/students/login">Portal Login</Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="hidden transition-transform md:inline-flex"
                    size="sm"
                  >
                    <Link href="/auth/signin">Admin Login</Link>
                  </Button>
                </>
              )}

              <AnimatedThemeToggler />

              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 transition-transform md:hidden"
                  >
                    <Menu className="size-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[85vw] max-w-sm border-border/50 bg-background/95 p-0 backdrop-blur-xl"
                >
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <nav className="flex h-full flex-col p-6">
                    <div className="mb-8 border-b border-border/20 pb-6">
                      <Link
                        href="/"
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 text-xl font-bold transition-colors hover:text-primary"
                      >
                        <Logo />
                      </Link>
                    </div>

                    <div className="flex-1 space-y-2">
                      {menuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleLinkClick}
                          className="group text-muted-foreground hover:bg-primary/10 hover:text-foreground relative flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:translate-x-1 active:scale-95"
                        >
                          <span className="relative z-10">{item.name}</span>
                          <div className="from-primary/5 absolute inset-0 rounded-lg bg-linear-to-r to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3 border-t border-border/20 pt-6">
                      {isCheckingSession ? (
                        <div className="space-y-3">
                          <Skeleton className="h-11 w-full rounded-xl" />
                          <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                      ) : activeHref ? (
                        <Button
                          variant="default"
                          asChild
                          className="w-full py-3 text-sm shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
                          onClick={handleLinkClick}
                        >
                          <Link href={activeHref}>
                            {token ? "Platform Console" : "Portal"}
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            asChild
                            className="w-full py-3 text-sm"
                            onClick={handleLinkClick}
                          >
                            <Link href="/application-status">
                              Review Application
                            </Link>
                          </Button>
                          <Button
                            asChild
                            className="w-full py-3 text-sm"
                            onClick={handleLinkClick}
                          >
                            <Link href="/students/login">Portal Login</Link>
                          </Button>
                          <Button
                            variant="outline"
                            asChild
                            className="w-full py-3 text-sm"
                            onClick={handleLinkClick}
                          >
                            <Link href="/auth/signin">Admin Login</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
