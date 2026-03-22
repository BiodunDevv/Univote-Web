"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Globe,
  Headset,
  House,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
  Vote,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { useStudentPwaInstallState } from "@/lib/store/useStudentPwaStore";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
} from "@/lib/tenant-config";
import { compactUi } from "@/lib/compact-ui";

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
  if (
    pathname === "/students/notifications" ||
    pathname.startsWith("/students/notifications/")
  ) {
    return "Notifications";
  }

  if (
    pathname === "/students/support" ||
    pathname.startsWith("/students/support/")
  ) {
    return "Support";
  }

  const matched = navigationItems.find((item) =>
    isActivePath(pathname, item.href),
  );
  if (!matched) return "Portal";
  return matched.label;
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { student, tenant, logout } = useStudentAuthStore();
  const { canInstall, isPrompting, promptInstall } =
    useStudentPwaInstallState();
  const { data: unreadNotifications = 0 } =
    useNotificationSummaryQuery("student");
  const participantLabels = getTenantParticipantLabels(tenant);

  const pageTitle = useMemo(() => titleFromPath(pathname), [pathname]);
  const isVoteRoute =
    pathname === "/students/vote" || pathname.startsWith("/students/vote/");
  const isSupportRoute =
    pathname === "/students/support" ||
    pathname.startsWith("/students/support/");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const initials = student?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const participantIdentifier = formatParticipantIdentifier(
    student as unknown as Record<string, unknown>,
    tenant,
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/students/login");
  };

  const openWebsite = () => {
    window.open("/", "_blank", "noopener,noreferrer");
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  if (isVoteRoute) {
    return (
      <div className="min-h-svh overflow-x-hidden bg-background">
        <div className="sticky top-0 z-40 border-b border-border/70 bg-background/95 px-3 py-3 backdrop-blur xl:px-6">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Guided vote
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {student
                    ? `${student.full_name.split(" ")[0]}'s ballot`
                    : "Voting flow"}
                </p>
              </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                className="hidden h-9 rounded-xl px-3 text-xs sm:inline-flex"
                onClick={openWebsite}
              >
                <Globe className="mr-1.5 h-3.5 w-3.5" />
                Website
              </Button>
            </div>
          </div>
        </div>
        <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-6xl flex-col px-3 py-3 sm:px-4 xl:px-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-muted/20">
      <div className="mx-auto min-h-svh w-full max-w-[1680px] px-2 pb-28 pt-2 sm:px-4 sm:pt-3 lg:pb-8">
        <aside
          className="fixed inset-y-4 z-20 hidden w-72 lg:block"
          style={{ left: "max(1rem, calc((100vw - 1680px) / 2 + 1rem))" }}
        >
          <Card className="flex h-full flex-col justify-between overflow-hidden border bg-card/95 p-4 shadow-none">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        tenant?.branding?.accent_color ||
                        tenant?.branding?.primary_color ||
                        "currentColor",
                    }}
                  />
                  {tenant?.name || `Univote ${participantLabels.singular}`}
                </div>
                <div>
                  <h1 className={compactUi.typography.pageTitle}>
                    Voting workspace
                  </h1>

                  {tenant ? (
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{tenant.slug}</span>
                      </div>
                      {tenant.branding?.support_email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{tenant.branding.support_email}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
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

              <div className="rounded-2xl border bg-muted/20 p-3">
                <p className={compactUi.typography.cardTitle}>Need help?</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Open a support ticket and keep all replies in one thread.
                </p>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/students/support">
                    <Headset className="mr-2 h-4 w-4" />
                    Support
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border bg-muted/20 p-3">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage
                    src={student?.photo_url || undefined}
                    alt={student?.full_name || participantLabels.singular}
                  />
                  <AvatarFallback>{initials || "PT"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {student?.full_name || participantLabels.singular}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {participantIdentifier || "Portal access"}
                    {tenant?.name ? ` • ${tenant.name}` : ""}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void handleLogout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </Card>
        </aside>

        <main className="min-w-0 lg:ml-[19.25rem]">
          <div className="sticky top-0 z-30 mb-3 shrink-0">
            <div
              className={cn(
                "rounded-2xl border px-3 py-2.5 transition-all duration-300 ease-out",
                isScrolled
                  ? "border-border/50 bg-background/90 shadow-sm shadow-black/5 backdrop-blur-xl"
                  : "border-transparent bg-background/60 backdrop-blur",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Link href="/students/home" className="shrink-0">
                    <LogoIcon className="h-7 w-7" />
                  </Link>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-muted-foreground">
                      {pageTitle}
                    </p>
                    <p className="truncate text-sm font-semibold leading-snug text-foreground">
                      {student
                        ? `Hi, ${student.full_name.split(" ")[0]}`
                        : `${participantLabels.singular} portal`}
                    </p>
                    {tenant?.name ? (
                      <p className="mt-0.5 truncate text-[11px] leading-none text-muted-foreground">
                        {tenant.name}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {canInstall ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden h-8 rounded-xl px-2 text-xs sm:inline-flex"
                      onClick={() => void handleInstall()}
                      disabled={isPrompting}
                    >
                      {isPrompting ? "Installing..." : "Install"}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden h-8 rounded-xl px-2 text-xs md:inline-flex"
                    onClick={openWebsite}
                  >
                    <Globe className="mr-1.5 h-3.5 w-3.5" />
                    Website
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="relative size-8 rounded-xl"
                  >
                    <Link
                      href="/students/notifications"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4" />
                      <NotificationCountBadge
                        count={unreadNotifications}
                        className="absolute -right-1.5 -top-1.5"
                      />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="size-8 rounded-xl"
                  >
                    <Link href="/students/support" aria-label="Support">
                      <Headset className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Link
                    href="/students/profile"
                    aria-label="Open profile"
                    className="shrink-0 rounded-xl outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={student?.photo_url || undefined}
                        alt={student?.full_name || "Participant"}
                      />
                      <AvatarFallback className="text-xs">
                        {initials || "PT"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "min-w-0 space-y-3",
              isSupportRoute &&
                "h-[calc(100svh-13rem)] min-h-0 pb-0 lg:h-[calc(100svh-8rem)]",
            )}
          >
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-3 z-40 px-3 lg:hidden">
        <div
          className="mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-[28px] border border-border/70 bg-background/95 px-2 py-2 shadow-xl shadow-black/10 backdrop-blur"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.55rem)",
          }}
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2.5 text-[10px] font-medium transition-all duration-200",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="truncate leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
