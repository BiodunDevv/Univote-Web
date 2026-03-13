"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import React, { useEffect, useState, useSyncExternalStore } from "react";
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
  { name: "Universities", href: "/#universities" },
  { name: "Students", href: "/#students" },
  { name: "Contact", href: "/#contact" },
];

export const HeroHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const { token } = useAuthStore();
  const { token: studentToken } = useStudentAuthStore();
  const activeHref = token
    ? "/dashboard"
    : studentToken
      ? "/students/home"
      : null;
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 p-2 sm:p-4">
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 transition-all duration-300 ease-out sm:px-4 sm:py-3",
            isScrolled
              ? "bg-background/40 border-border/50 shadow-lg shadow-black/5 backdrop-blur-2xl"
              : "bg-transparent"
          )}
        >
          {/* Left section - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold"
            >
              <Logo />
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right section - Actions and Theme Toggle */}
          <div className="flex items-center gap-3">
            {!mounted ? (
              // Loading state to prevent hydration flash
              <>
                <div className="hidden md:inline-flex h-9 w-20 bg-muted animate-pulse rounded-md"></div>
                <div className="hidden md:inline-flex h-9 w-9 bg-muted animate-pulse rounded-md"></div>
              </>
            ) : activeHref ? (
              // Authenticated user menu
              <Button
                variant="outline"
                asChild
                className="hidden transition-transform md:inline-flex"
                size="sm"
              >
                <Link href={activeHref}>
                  {token ? "Admin Dashboard" : "Student Portal"}
                </Link>
              </Button>
            ) : (
              // Non-authenticated user buttons
              <>
                <Button
                  asChild
                  className="hidden transition-transform md:inline-flex"
                  size="sm"
                >
                  <Link href="/students/login">Student Login</Link>
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

            {/* Mobile Menu */}
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
                className="border-border/50 bg-background/95 w-[85vw] max-w-sm backdrop-blur-xl p-0"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex h-full flex-col p-6">
                  {/* Header */}
                  <div className="border-border/20 mb-8 border-b pb-6">
                    <Link
                      href="/"
                      onClick={handleLinkClick}
                      className="hover:text-primary flex items-center gap-3 text-xl font-bold transition-colors"
                    >
                      <Logo />
                    </Link>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex-1 space-y-2">
                    {menuItems.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        onClick={handleLinkClick}
                        className="group text-muted-foreground hover:bg-primary/10 hover:text-foreground relative flex items-center rounded-lg px-4 py-3 text-base font-medium transition-all duration-300 hover:translate-x-1 active:scale-95"
                      >
                        <span className="relative z-10">{item.name}</span>
                        <div className="from-primary/5 absolute inset-0 rounded-lg bg-linear-to-r to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>

                  {/* Footer Section */}
                  <div className="border-border/20 space-y-3 border-t pt-6 mt-6">
                    {!mounted ? (
                      // Loading state for mobile menu
                      <>
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
                      </>
                    ) : activeHref ? (
                      // Authenticated mobile menu
                      <Button
                        variant="default"
                        asChild
                        className="w-full py-3 text-base shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
                        onClick={handleLinkClick}
                      >
                        <Link href={activeHref}>
                          {token ? "Admin Dashboard" : "Student Portal"}
                        </Link>
                      </Button>
                    ) : (
                      // Non-authenticated mobile menu
                      <>
                        <Button
                          asChild
                          className="w-full py-3 text-base "
                          onClick={handleLinkClick}
                        >
                          <Link href="/students/login">Student Login</Link>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="w-full py-3 text-base"
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
    </header>
  );
};
