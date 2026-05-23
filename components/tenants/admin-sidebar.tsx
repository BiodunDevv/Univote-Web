"use client";

import * as React from "react";
import {
  Activity,
  Megaphone,
  BarChart3,
  Bell,
  Building2,
  Fingerprint,
  FileBarChart,
  LifeBuoy,
  GraduationCap,
  LayoutDashboard,
  FlaskConical,
  Settings2,
  UserCog,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSearch, type SearchItem } from "@/components/nav-search";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
import { isTenantParticipantFieldEnabled } from "@/lib/tenant-config";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const UnivoteLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 80 80"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M80 28.558L69.909 11.081L50 22.578V0H30V22.571L10.091 11.081L0 28.555L19.824 40L0 51.445L10.091 68.919L30 57.425V80H50V57.422L69.912 68.919L80 51.442L60.183 40L80 28.558Z" />
  </svg>
);

type NavSubItem = {
  title: string;
  url: string;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: NavSubItem[];
};

const adminNavMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Students",
    url: "/dashboard/students",
    icon: GraduationCap,
  },
  {
    title: "Elections",
    url: "/dashboard/elections",
    icon: Vote,
    items: [
      { title: "All Elections", url: "/dashboard/elections" },
      { title: "Create Election", url: "/dashboard/elections/create" },
      { title: "Election Results", url: "/dashboard/election-analytics" },
    ],
  },
  {
    title: "Colleges",
    url: "/dashboard/structure/colleges",
    icon: Building2,
  },
  {
    title: "Departments",
    url: "/dashboard/structure/departments",
    icon: Building2,
  },
  {
    title: "Admin Users",
    url: "/dashboard/admins",
    icon: UserCog,
    items: [
      { title: "All Admins", url: "/dashboard/admins" },
      { title: "Invite Admin", url: "/dashboard/admins/create" },
      { title: "Role Assignments", url: "/dashboard/admins/roles" },
    ],
  },
  {
    title: "Candidates",
    url: "/dashboard/candidates",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    items: [
      { title: "Overview", url: "/dashboard/analytics" },
      { title: "Biometric Review", url: "/dashboard/biometrics" },
    ],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileBarChart,
  },
];

const adminNavProjects = [
  { name: "Announcements", url: "/dashboard/announcements", icon: Megaphone },
  { name: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { name: "Support", url: "/dashboard/support", icon: LifeBuoy },
  { name: "System Health", url: "/dashboard/system-health", icon: Activity },
  { name: "Testing", url: "/dashboard/testing", icon: FlaskConical },
  { name: "Biometrics", url: "/dashboard/biometrics", icon: Fingerprint },
  { name: "Settings", url: "/dashboard/settings", icon: Settings2 },
];

function buildSearchItems(
  navMain: NavItem[],
  navProjects: typeof adminNavProjects,
): SearchItem[] {
  const results: SearchItem[] = [];

  navMain.forEach((item) => {
    if (item.items?.length && item.items.length > 1) {
      item.items.forEach((subItem) =>
        results.push({
          title: subItem.title,
          url: subItem.url,
          group: item.title,
        }),
      );
      return;
    }

    results.push({
      title: item.title,
      url: item.items?.[0]?.url || item.url,
      group: "Navigation",
    });
  });

  navProjects.forEach((project) =>
    results.push({
      title: project.name,
      url: project.url,
      group: "Tools",
    }),
  );

  return results;
}

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { admin, tenant, membership } = useAuthStore();
  const { data: unreadNotifications = 0 } =
    useNotificationSummaryQuery("admin");
  const canManageStudents = hasAnyTenantPermission(membership, [
    "students.manage",
    "tenant.manage",
  ]);
  const canViewParticipants = hasAnyTenantPermission(membership, [
    "participants.view",
    "participants.manage",
    "students.manage",
    "tenant.manage",
  ]);
  const canManageSessions = hasAnyTenantPermission(membership, [
    "sessions.manage",
    "tenant.manage",
  ]);
  const canManageAdmins = hasAnyTenantPermission(membership, [
    "admins.manage",
    "tenant.manage",
  ]);
  const canViewAnalytics = hasAnyTenantPermission(membership, [
    "analytics.view",
    "tenant.manage",
  ]);
  const canExportReports = hasAnyTenantPermission(membership, [
    "reports.export",
    "tenant.manage",
  ]);
  const advancedAnalyticsEnabled =
    tenant?.entitlements?.advanced_analytics !== false;
  const advancedReportsEnabled =
    tenant?.entitlements?.advanced_reports !== false;
  const structureEnabled =
    isTenantParticipantFieldEnabled(tenant, "college") ||
    isTenantParticipantFieldEnabled(tenant, "department");
  const collegeEnabled = isTenantParticipantFieldEnabled(tenant, "college");
  const departmentEnabled = isTenantParticipantFieldEnabled(
    tenant,
    "department",
  );
  const canViewStructure =
    structureEnabled &&
    (canManageStudents || canManageSessions || canManageAdmins);

  const navMain = React.useMemo(
    () =>
      adminNavMain
        .map((item) =>
          item.title === "Elections" && !advancedAnalyticsEnabled
            ? {
                ...item,
                items: item.items?.filter(
                  (subItem) => subItem.url !== "/dashboard/election-analytics",
                ),
              }
            : item,
        )
        .filter((item) => {
          switch (item.title) {
            case "Students":
              return canViewParticipants;
            case "Elections":
            case "Candidates":
              return canManageSessions;
            case "Colleges":
              return canViewStructure && collegeEnabled;
            case "Departments":
              return canViewStructure && departmentEnabled;
            case "Admin Users":
              return canManageAdmins;
            case "Analytics":
              return canViewAnalytics && advancedAnalyticsEnabled;
            case "Reports":
              return canExportReports && advancedReportsEnabled;
            default:
              return true;
          }
        }),
    [
      advancedAnalyticsEnabled,
      advancedReportsEnabled,
      collegeEnabled,
      canManageAdmins,
      canManageSessions,
      canViewParticipants,
      canViewAnalytics,
      canExportReports,
      canViewStructure,
      departmentEnabled,
    ],
  );

  const navProjects = React.useMemo(
    () =>
      adminNavProjects
        .filter((item) => {
          if (item.name === "Biometrics") {
            return canViewAnalytics && tenant?.entitlements?.face_verification !== false;
          }
          return true;
        })
        .map((item) =>
          item.name === "Notifications"
            ? {
                ...item,
                badge: unreadNotifications > 0 ? unreadNotifications : null,
              }
              : item,
        ),
    [
      canViewAnalytics,
      tenant,
      unreadNotifications,
    ],
  );

  const localizedNavMain = navMain;

  const teams = React.useMemo(
    () => [
      {
        name: tenant?.name || "University Workspace",
        slug: tenant?.slug || "tenant",
        logo: UnivoteLogo,
        active: true,
        plan: "University workspace",
      },
    ],
    [tenant],
  );

  const searchItems = React.useMemo(
    () => buildSearchItems(localizedNavMain, navProjects),
    [localizedNavMain, navProjects],
  );

  const user = {
    name: admin?.full_name ?? "Admin",
    email: admin?.email ?? "",
    avatar: "",
    role: admin?.role ?? "admin",
  };

  return (
    <Sidebar collapsible="offcanvas" data-tour="admin-sidebar" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
        <NavSearch items={searchItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={localizedNavMain} label="Navigation" />
        <NavProjects projects={navProjects} label="Tools" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} scope="tenant" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
