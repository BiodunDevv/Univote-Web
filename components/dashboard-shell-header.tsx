"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Kbd } from "@/components/ui/kbd";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { AdminChatWidget } from "@/components/support/admin-chat-widget";
import {
  getTenantParticipantLabels,
  isTenantParticipantFieldEnabled,
} from "@/lib/tenant-config";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "super-admin": "Platform Console",
  elections: "Elections",
  create: "Create",
  edit: "Edit",
  colleges: "Colleges",
  structure: "Structure",
  admins: "Admins",
  settings: "Settings",
  "audit-logs": "Audit Logs",
  testing: "Testing Hub",
  analytics: "Analytics",
  reports: "Reports",
  notifications: "Notifications",
  integrations: "Integrations",
  students: "Participants",
  participants: "Participants",
  candidates: "Candidates",
  departments: "Departments",
  permissions: "Permissions",
  "election-analytics": "Election Analytics",
  "system-health": "System Health",
  tenants: "Tenants",
  onboarding: "Onboarding",
  testimonials: "Testimonials",
};

function titleFromSegment(segment: string, previous?: string) {
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }

  if (/^[a-f0-9]{20,}$/i.test(segment) || /^[a-f0-9-]{8,}$/i.test(segment)) {
    if (previous === "elections") return "Election Details";
    if (previous === "admins") return "Admin Details";
    if (previous === "colleges") return "College Details";
    if (previous === "students" || previous === "participants") {
      return "Participant Details";
    }
    if (previous === "candidates") return "Candidate Details";
    if (previous === "departments") return "Department Details";
    return "Details";
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardShellHeader({
  rootSegment = "dashboard",
}: {
  rootSegment?: "dashboard" | "super-admin";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, tenant, membership } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const { data: unreadNotifications = 0 } =
    useNotificationSummaryQuery("admin");
  const segments = pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.indexOf(rootSegment);
  const trail =
    dashboardIndex >= 0 ? segments.slice(dashboardIndex) : [rootSegment];
  const getTrailLabel = (segment: string, previous?: string) => {
    if (segment === "students" || segment === "participants") {
      return participantLabels.plural;
    }

    if (
      segment === "edit" &&
      (previous === "students" || previous === "participants")
    ) {
      return `Edit ${participantLabels.singular}`;
    }

    if (
      /^[a-f0-9]{20,}$/i.test(segment) &&
      (previous === "students" || previous === "participants")
    ) {
      return `${participantLabels.singular} Details`;
    }

    return titleFromSegment(segment, previous);
  };
  const currentSegment = trail[trail.length - 1] ?? rootSegment;
  const currentTitle = getTrailLabel(currentSegment, trail[trail.length - 2]);
  const notificationsPath =
    rootSegment === "super-admin"
      ? "/super-admin/notifications"
      : "/dashboard/notifications";
  const permissions = React.useMemo(
    () =>
      new Set([
        ...(admin?.permissions || []),
        ...(membership?.permissions || []),
      ]),
    [admin?.permissions, membership?.permissions],
  );
  const structureEnabled =
    isTenantParticipantFieldEnabled(tenant, "college") ||
    isTenantParticipantFieldEnabled(tenant, "department");
  const tenantTabs = React.useMemo(
    () =>
      [
        {
          value: "/dashboard",
          label: "Overview",
          match: (path: string) => path === "/dashboard",
          visible: true,
        },
        {
          value: "/dashboard/students",
          label: participantLabels.plural,
          match: (path: string) =>
            path.startsWith("/dashboard/participants") ||
            path.startsWith("/dashboard/students"),
          visible: true,
        },
        {
          value: "/dashboard/structure/colleges",
          label: "Colleges",
          match: (path: string) =>
            path.startsWith("/dashboard/structure/colleges") ||
            path.startsWith("/dashboard/colleges"),
          visible:
            structureEnabled &&
            isTenantParticipantFieldEnabled(tenant, "college"),
        },
        {
          value: "/dashboard/structure/departments",
          label: "Departments",
          match: (path: string) =>
            path.startsWith("/dashboard/structure/departments") ||
            path.startsWith("/dashboard/departments"),
          visible:
            structureEnabled &&
            isTenantParticipantFieldEnabled(tenant, "department"),
        },
        {
          value: "/dashboard/elections",
          label: "Elections",
          match: (path: string) => path.startsWith("/dashboard/elections"),
          visible: true,
        },
        {
          value: "/dashboard/admins",
          label: "Admins",
          match: (path: string) => path.startsWith("/dashboard/admins"),
          visible:
            permissions.size === 0 ||
            permissions.has("tenant.roles.manage") ||
            permissions.has("tenant.manage"),
        },
        {
          value: "/dashboard/analytics",
          label: "Analytics",
          match: (path: string) =>
            path.startsWith("/dashboard/analytics") ||
            path.startsWith("/dashboard/biometrics") ||
            path.startsWith("/dashboard/reports") ||
            path.startsWith("/dashboard/system-health") ||
            path.startsWith("/dashboard/audit-logs") ||
            path.startsWith("/dashboard/election-analytics") ||
            path.startsWith("/dashboard/testing"),
          visible:
            tenant?.entitlements?.advanced_analytics !== false ||
            tenant?.entitlements?.advanced_reports !== false,
        },
        {
          value: "/dashboard/settings",
          label: "Settings",
          match: (path: string) =>
            path.startsWith("/dashboard/settings") ||
            path.startsWith("/dashboard/notifications") ||
            path.startsWith("/dashboard/integrations"),
          visible: true,
        },
        {
          value: "/dashboard/application",
          label: "Application",
          match: (path: string) => path.startsWith("/dashboard/application"),
          visible: permissions.size === 0 || permissions.has("tenant.manage"),
        },
      ].filter((tab) => tab.visible),
    [
      participantLabels.plural,
      permissions,
      structureEnabled,
      tenant,
    ],
  );
  const superAdminTabs = React.useMemo(
    () => [
      {
        value: "/super-admin",
        label: "Overview",
        match: (path: string) => path === "/super-admin",
      },
      {
        value: "/super-admin/tenants",
        label: "Tenants",
        match: (path: string) => path.startsWith("/super-admin/tenants"),
      },
      {
        value: "/super-admin/onboarding",
        label: "Onboarding",
        match: (path: string) => path.startsWith("/super-admin/onboarding"),
      },
      {
        value: "/super-admin/announcements",
        label: "Announcements",
        match: (path: string) => path.startsWith("/super-admin/announcements"),
      },
      {
        value: "/super-admin/testimonials",
        label: "Testimonials",
        match: (path: string) => path.startsWith("/super-admin/testimonials"),
      },
      {
        value: "/super-admin/biometrics",
        label: "Biometrics",
        match: (path: string) => path.startsWith("/super-admin/biometrics"),
      },
      {
        value: "/super-admin/system-health",
        label: "System Health",
        match: (path: string) => path.startsWith("/super-admin/system-health"),
      },
      {
        value: "/super-admin/settings",
        label: "Settings",
        match: (path: string) => path.startsWith("/super-admin/settings"),
      },
      {
        value: "/super-admin/notifications",
        label: "Notifications",
        match: (path: string) => path.startsWith("/super-admin/notifications"),
      },
    ],
    [],
  );
  const navTabs = rootSegment === "super-admin" ? superAdminTabs : tenantTabs;
  const activeTab =
    navTabs.find((tab) => tab.match(pathname))?.value ??
    navTabs[0]?.value ??
    `/${rootSegment}`;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
      <div className="mx-auto flex w-full flex-col gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 md:flex-1">
            <SidebarTrigger className="shrink-0 border bg-background transition-colors hover:bg-accent hover:text-accent-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground md:hidden">
                {currentTitle}
              </p>
              <p className="hidden text-xs font-medium text-muted-foreground md:block">
                {rootSegment === "super-admin"
                  ? "Platform operations"
                  : "Tenant operations"}
              </p>
              <p className="hidden truncate text-sm font-semibold text-foreground md:block">
                {currentTitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <AdminChatWidget
              showTenant={rootSegment === "super-admin"}
              supportPath={
                rootSegment === "super-admin"
                  ? "/super-admin/support"
                  : "/dashboard/support"
              }
            />
            <Button
              variant="outline"
              asChild
              className="relative"
              data-tour="admin-notifications"
            >
              <Link href={notificationsPath}>
                <Bell className="h-4 w-4" />
                <span className="hidden lg:inline">Notifications</span>
                <NotificationCountBadge
                  count={unreadNotifications}
                  className="absolute -right-1.5 -top-1.5"
                />
              </Link>
            </Button>
            <div className="hidden items-center gap-2 rounded-md border bg-background px-3 py-1 text-xs text-muted-foreground md:flex">
              <span>Search</span>
              <Kbd>/</Kbd>
            </div>
            <AnimatedThemeToggler
              variant="header"
              enableShortcut
              className="max-w-full"
            />
          </div>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => router.push(value)}
          className="w-full"
          data-tour="admin-header-tabs"
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-linear-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-linear-to-l from-background to-transparent" />
            <TabsList
              variant="line"
              className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto border-b px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {navTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="shrink-0 px-3 py-2 text-xs data-[state=active]:border-primary/40 data-[state=active]:bg-muted sm:px-4"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>
    </header>
  );
}
