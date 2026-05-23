"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Globe,
  Headset,
  House,
  LogOut,
  Mail,
  Share,
  ShieldCheck,
  UserRound,
  Vote,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { useStudentPwaInstallState } from "@/lib/store/useStudentPwaStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { StudentLogoutConfirmDialog } from "@/components/students/portal/logout-confirm-dialog";
import {
  formatParticipantIdentifier,
  getTenantParticipantLabels,
} from "@/lib/tenant-config";

const navigationItems = [
  { href: "/students/home", label: "Home", icon: House },
  { href: "/students/elections", label: "Elections", icon: ShieldCheck },
  { href: "/students/vote", label: "Vote", icon: Vote },
  { href: "/students/results", label: "Results", icon: BarChart3 },
  { href: "/students/profile", label: "Profile", icon: UserRound },
];

const PULL_REFRESH_MAX = 104;
const PULL_REFRESH_TRIGGER = 78;

// Maps a deep path → { title, parent } for sub-pages
// This is how the shell knows it's "inside" a tab, not at the root.
const subPageMeta: Record<string, { title: string; parent: string }> = {
  "/students/profile/edit": { title: "Edit profile", parent: "/students/profile" },
  "/students/profile/password": { title: "Change password", parent: "/students/profile" },
};

// Dynamic sub-page detection for parameterised routes
function getSubPageMeta(pathname: string): { title: string; parent: string } | null {
  // Static entries first
  if (subPageMeta[pathname]) return subPageMeta[pathname];

  // /students/elections/[id]
  if (/^\/students\/elections\/[^/]+$/.test(pathname)) {
    return { title: "Election detail", parent: "/students/elections" };
  }
  // /students/results/[id]
  if (/^\/students\/results\/[^/]+$/.test(pathname)) {
    return { title: "Result board", parent: "/students/results" };
  }
  // /students/vote/[id]/submitted
  if (/^\/students\/vote\/[^/]+\/submitted$/.test(pathname)) {
    return { title: "Submitted ballot", parent: "/students/vote" };
  }
  // /students/notifications — treat as top-level tab (no back)
  // /students/support — treat as top-level tab (no back)
  return null;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function detectIosInstallEnvironment() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const touchMac =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  const iosLike = /iphone|ipad|ipod/.test(ua) || touchMac;
  return iosLike && !isStandaloneMode();
}

function isActivePath(pathname: string, href: string) {
  if (href === "/students/home") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function rootLabelFromPath(pathname: string) {
  if (pathname === "/students/notifications" || pathname.startsWith("/students/notifications/")) return "Notifications";
  if (pathname === "/students/support" || pathname.startsWith("/students/support/")) return "Support";
  const matched = navigationItems.find((item) => isActivePath(pathname, item.href));
  return matched?.label ?? "Portal";
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { student, tenant, logout } = useStudentAuthStore();
  const { canInstall, isInstalled, isPrompting, promptInstall } = useStudentPwaInstallState();
  const { data: unreadNotifications = 0 } = useNotificationSummaryQuery("student");
  const participantLabels = getTenantParticipantLabels(tenant);
  const isMobile = useIsMobile();

  const subPage = useMemo(() => getSubPageMeta(pathname), [pathname]);
  const isVoteRoute = /^\/students\/vote\/[^/]+/.test(pathname);
  const isSupportRoute = pathname === "/students/support" || pathname.startsWith("/students/support/");

  const [isScrolled, setIsScrolled] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iosInstallGuideOpen, setIosInstallGuideOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isIosInstallEligible, setIsIosInstallEligible] = useState(false);
  const pullDistanceRef = useRef(0);

  useEffect(() => {
    const evaluateInstallEnvironment = () => setIsIosInstallEligible(detectIosInstallEnvironment());
    evaluateInstallEnvironment();
    window.addEventListener("resize", evaluateInstallEnvironment);
    return () => window.removeEventListener("resize", evaluateInstallEnvironment);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    let startY = 0;
    let pulling = false;
    let maybePull = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return;
      startY = e.touches[0]?.clientY || 0;
      pulling = true;
      maybePull = true;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling || window.scrollY > 0 || !maybePull) return;
      const distance = Math.max(0, Math.min(PULL_REFRESH_MAX, (e.touches[0]?.clientY || 0) - startY));
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    };
    const handleTouchEnd = () => {
      const distance = pullDistanceRef.current;
      if (distance >= PULL_REFRESH_TRIGGER && !isRefreshing) {
        setIsRefreshing(true);
        const isStandalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          Boolean((window.navigator as { standalone?: boolean }).standalone);
        if (isStandalone) window.location.reload();
        else router.refresh();
        window.setTimeout(() => {
          setIsRefreshing(false);
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }, 450);
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      pulling = false;
      maybePull = false;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, isRefreshing, router]);

  const initials = student?.full_name
    ?.split(" ").slice(0, 2).map((p) => p.charAt(0)).join("").toUpperCase();
  const participantIdentifier = formatParticipantIdentifier(
    student as unknown as Record<string, unknown>,
    tenant,
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutConfirmOpen(false);
      router.replace("/students/login");
    } finally {
      setIsLoggingOut(false);
    }
  };
  const openWebsite = () => window.open("/", "_blank", "noopener,noreferrer");
  const handleInstall = async () => {
    if (canInstall) { await promptInstall(); return; }
    if (isIosInstallEligible) setIosInstallGuideOpen(true);
  };

  const shouldShowInstallAction = !isInstalled && (canInstall || isIosInstallEligible);
  const pullRefreshHint = isRefreshing
    ? "Refreshing..."
    : pullDistance >= PULL_REFRESH_TRIGGER ? "Release to refresh"
    : pullDistance > 10 ? "Pull a little more..."
    : "Pull down to refresh";

  const handleBack = () => {
    if (subPage?.parent) {
      router.push(subPage.parent);
    } else {
      router.back();
    }
  };

  // ── Vote flow: minimal chrome ──────────────────────────────────────────────
  if (isVoteRoute) {
    return (
      <div className="min-h-svh overflow-x-hidden bg-background">
        {isMobile && (
          <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center">
            <div className={cn(
            "rounded-full border px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-all duration-200",
              pullDistance > 8 || isRefreshing ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
            )}>
              {pullRefreshHint}
            </div>
          </div>
        )}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="press-scale flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-foreground transition-colors hover:border-border/80"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Secure ballot
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {student ? `${student.full_name.split(" ")[0]}'s ballot` : "Voting flow"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 rounded-xl px-3 text-xs sm:inline-flex"
              onClick={openWebsite}
            >
              <Globe className="mr-1.5 h-3.5 w-3.5" />
              Website
            </Button>
          </div>
        </header>
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col px-4 py-4">
          {children}
        </div>
      </div>
    );
  }

  // ── Main portal shell ──────────────────────────────────────────────────────
  return (
    <div className="min-h-svh overflow-x-hidden bg-background">
      {/* Pull-to-refresh pill */}
      {isMobile && (
        <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center">
          <div className={cn(
            "rounded-full border px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-all duration-200",
            pullDistance > 8 || isRefreshing ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          )}>
            {pullRefreshHint}
          </div>
        </div>
      )}

      <div className="mx-auto min-h-svh w-full max-w-[1680px] px-2 pb-28 pt-2 sm:px-4 sm:pt-3 lg:pb-8">

        {/* ── Sidebar (desktop) ──────────────────────────────────────────── */}
        <aside
          data-tour="student-sidebar"
          className="fixed inset-y-4 z-20 hidden w-[260px] lg:block"
          style={{ left: "max(1rem, calc((100vw - 1680px) / 2 + 1rem))" }}
        >
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 shadow-lg shadow-black/5">
            {/* Brand header */}
            <div className="border-b border-border/60 px-5 py-5">
              <div className="flex items-center gap-3">
                <LogoIcon className="h-8 w-8 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight text-foreground">
                    {tenant?.name || "Univote"}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {participantLabels.singular} portal
                  </p>
                </div>
              </div>
              {tenant?.branding?.support_email && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tenant.branding.support_email}</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" data-tour="student-primary-nav">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "press-scale group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
                    {item.label}
                    {item.href === "/students/vote" && (
                      <span className={cn(
                        "ml-auto inline-flex h-1.5 w-1.5 shrink-0 rounded-full",
                        active ? "bg-background/60" : "bg-primary/70",
                      )} />
                    )}
                  </Link>
                );
              })}

              <div className="pt-3">
                <div className="mb-2 px-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">Help</p>
                </div>
                <Link
                  href="/students/notifications"
                  className={cn(
                    "press-scale group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActivePath(pathname, "/students/notifications")
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="relative">
                    <Bell className="h-[18px] w-[18px] opacity-70 group-hover:opacity-100" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </div>
                  Notifications
                </Link>
                <Link
                  href="/students/support"
                  className={cn(
                    "press-scale group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActivePath(pathname, "/students/support")
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Headset className="h-[18px] w-[18px] opacity-70 group-hover:opacity-100" />
                  Support
                </Link>
              </div>
            </nav>

            {/* Profile footer */}
            <div className="border-t border-border/60 p-3" data-tour="student-profile-card">
              <div className="flex items-center gap-3 rounded-xl border px-3 py-3">
                <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border">
                  <AvatarImage className="object-cover" src={student?.photo_url || undefined} alt={student?.full_name || participantLabels.singular} />
                  <AvatarFallback className="text-xs font-semibold">{initials || "PT"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                    {student?.full_name || participantLabels.singular}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                    {participantIdentifier || "Portal access"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  className="press-scale rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content area ─────────────────────────────────────────── */}
        <main className="min-w-0 lg:ml-[276px]">

          {/* ── Topbar ────────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-30 mb-4 shrink-0" data-tour="student-topbar">
            <div className={cn(
              "rounded-2xl border px-4 py-3 transition-all duration-300 ease-out",
              isScrolled
                ? "border-border/60 shadow-md shadow-black/5 backdrop-blur-xl"
                : "border-transparent backdrop-blur-md",
            )}>
              <div className="flex items-center justify-between gap-3">

                {/* Left — context-aware: back button on sub-pages, logo+title on root tabs */}
                <div className="flex min-w-0 items-center gap-3">
                  {subPage ? (
                    /* Sub-page: prominent back button + page title */
                    <>
                      <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Go back"
                        className="press-scale flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 text-foreground shadow-sm transition-colors hover:border-border active:scale-95 lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      {/* Desktop back — smaller, ghost */}
                      <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Go back"
                        className="press-scale hidden h-8 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:flex"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {subPage.parent === "/students/profile" ? "Profile"
                          : subPage.parent === "/students/elections" ? "Elections"
                          : subPage.parent === "/students/results" ? "Results"
                          : subPage.parent === "/students/vote" ? "Vote"
                          : "Back"}
                      </button>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {subPage.title}
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Root tab: logo + greeting */
                    <>
                      <Link href="/students/home" className="shrink-0 lg:hidden">
                        <LogoIcon className="h-7 w-7" />
                      </Link>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-muted-foreground">
                          {rootLabelFromPath(pathname)}
                        </p>
                        <p className="truncate text-sm font-semibold leading-snug text-foreground">
                          {student ? `Hi, ${student.full_name.split(" ")[0]}` : `${participantLabels.singular} portal`}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Right — context-aware actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {/* Install button only on root tabs */}
                  {!subPage && shouldShowInstallAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden h-8 rounded-xl px-2.5 text-xs font-medium sm:inline-flex"
                      onClick={() => void handleInstall()}
                      disabled={isPrompting}
                    >
                      {isPrompting ? "Installing..." : canInstall ? "Install app" : "Add to Home Screen"}
                    </Button>
                  )}

                  {/* Notifications bell — always visible on root tabs, hide on sub-pages to reduce clutter */}
                  {!subPage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="relative size-8 rounded-xl"
                    >
                      <Link href="/students/notifications" aria-label="Notifications">
                        <Bell className="h-4 w-4" />
                        <NotificationCountBadge count={unreadNotifications} className="absolute -right-1 -top-1 scale-90" />
                      </Link>
                    </Button>
                  )}

                  {/* Support button — only on root tabs */}
                  {!subPage && (
                    <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
                      <Link href="/students/support" aria-label="Support">
                        <Headset className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}

                  {/* Avatar — always */}
                  <Link
                    href="/students/profile"
                    aria-label="Open profile"
                    className="shrink-0 rounded-xl outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-border">
                      <AvatarImage className="object-cover" src={student?.photo_url || undefined} alt={student?.full_name || "Participant"} />
                      <AvatarFallback className="text-xs font-semibold">{initials || "PT"}</AvatarFallback>
                    </Avatar>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className={cn(
            "min-w-0",
            isSupportRoute && "h-[calc(100svh-13rem)] min-h-0 pb-0 lg:h-[calc(100svh-8rem)]",
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ──────────────────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-2 lg:hidden"
        data-tour="student-mobile-nav"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div
          className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 rounded-[26px] border border-border/60 px-2 py-2 shadow-2xl shadow-black/15 backdrop-blur-xl"
          style={{ backgroundColor: "var(--student-nav-bg)" }}
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            // On sub-pages, highlight the parent tab so users know their context
            const active =
              isActivePath(pathname, item.href) ||
              (subPage?.parent === item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "press-scale flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2.5 text-[10px] font-medium transition-all duration-200",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* iOS install dialog */}
      <StudentLogoutConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={handleLogout}
        isPending={isLoggingOut}
        studentName={student?.full_name}
      />

      {/* iOS install dialog */}
      <Dialog open={iosInstallGuideOpen} onOpenChange={setIosInstallGuideOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-display text-xl">Install Univote on your iPhone</DialogTitle>
            <DialogDescription>
              Safari doesn&apos;t show the standard install prompt, but you can save Univote as a full-screen app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              <>Tap the <span className="font-semibold text-foreground">Share</span> button in Safari.</>,
              <>Choose <span className="font-semibold text-foreground">Add to Home Screen</span>.</>,
              <>Open the saved app and continue with your student portal.</>,
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border px-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" className="w-full rounded-xl" onClick={() => setIosInstallGuideOpen(false)}>
              <Share className="mr-2 h-4 w-4" />
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
