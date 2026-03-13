"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  House,
  LogOut,
  ShieldCheck,
  UserRound,
  Vote,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";

const navigationItems = [
  { href: "/students/home", label: "Home", icon: House },
  { href: "/students/sessions", label: "Sessions", icon: ShieldCheck },
  { href: "/students/vote", label: "Vote", icon: Vote },
  { href: "/students/results", label: "Results", icon: BarChart3 },
  { href: "/students/profile", label: "Profile", icon: UserRound },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/students/home") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function titleFromPath(pathname: string) {
  const matched = navigationItems.find((item) => isActivePath(pathname, item.href));
  if (!matched) return "Student Portal";
  return matched.label;
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { student, logout } = useStudentAuthStore();

  const pageTitle = useMemo(() => titleFromPath(pathname), [pathname]);
  const initials = student?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace("/students/login");
  };

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-7xl gap-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <Card className="sticky top-6 flex h-[calc(100svh-3rem)] flex-col justify-between border bg-card/80 p-5 shadow-none">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="inline-flex rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Univote Student
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Secure campus voting
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Move through sessions, voting, results, and your account from one workspace.
                  </p>
                </div>
              </div>

              <nav className="space-y-1.5">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={student?.photo_url || undefined} alt={student?.full_name || "Student"} />
                  <AvatarFallback>{initials || "ST"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {student?.full_name || "Student"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {student?.matric_no || "Portal access"}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => void handleLogout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </Card>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 mb-5 rounded-3xl border bg-background/95 p-4 shadow-none backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {pageTitle}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">
                  {student ? `Welcome, ${student.full_name.split(" ")[0]}` : "Student portal"}
                </h2>
              </div>
              <div className="flex items-center gap-3 lg:hidden">
                <Avatar>
                  <AvatarImage src={student?.photo_url || undefined} alt={student?.full_name || "Student"} />
                  <AvatarFallback>{initials || "ST"}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <div className="space-y-5">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
