"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Vote,
  Building2,
  UserCog,
  FileText,
  Scan,
  Settings2,
  GraduationCap,
  BarChart3,
  FileBarChart,
  ShieldCheck,
  Activity,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSearch, type SearchItem } from "@/components/nav-search";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Univote logo component compatible with TeamSwitcher teams prop
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

const teams = [
  {
    name: "Univote",
    logo: UnivoteLogo,
    plan: "Campus Voting Platform",
  },
];

type NavSubItem = {
  title: string;
  url: string;
  comingSoon?: boolean;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: NavSubItem[];
  comingSoon?: boolean;
};

// ── Super-admin navigation ─────────────────────────────────────────────────

const superAdminNavMain: NavItem[] = [
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
    title: "Sessions",
    url: "/dashboard/sessions",
    icon: Vote,
    items: [
      { title: "All Sessions", url: "/dashboard/sessions" },
      { title: "Create Session", url: "/dashboard/sessions/create" },
      { title: "Results & Analytics", url: "/dashboard/election-analytics" },
    ],
  },
  {
    title: "Colleges",
    url: "/dashboard/colleges",
    icon: Building2,
    items: [
      { title: "All Colleges", url: "/dashboard/colleges" },
      { title: "Create College", url: "/dashboard/colleges/create" },
      { title: "Departments", url: "/dashboard/departments" },
    ],
  },
  {
    title: "Admin Users",
    url: "/dashboard/admins",
    icon: UserCog,
    items: [
      { title: "All Admins", url: "/dashboard/admins" },
      { title: "Create Admin", url: "/dashboard/admins/create" },
      {
        title: "Role Assignments",
        url: "/dashboard/admins/roles",
        comingSoon: true,
      },
    ],
  },
  {
    title: "Candidates",
    url: "/dashboard/candidates",
    icon: Users,
    items: [
      { title: "All Candidates", url: "/dashboard/candidates" },
    ],
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    items: [
      { title: "Overview", url: "/dashboard/analytics" },
    ],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileBarChart,
    items: [
      { title: "Generate Reports", url: "/dashboard/reports" },
    ],
  },
  {
    title: "Permissions",
    url: "/dashboard/permissions",
    icon: ShieldCheck,
    items: [
      { title: "Role Overview", url: "/dashboard/permissions" },
    ],
  },
];

const superAdminNavProjects = [
  { name: "Audit Logs", url: "/dashboard/audit-logs", icon: FileText },
  { name: "Face++ Testing", url: "/dashboard/facepp-test", icon: Scan },
  { name: "System Health", url: "/dashboard/system-health", icon: Activity },
  { name: "Settings", url: "/dashboard/settings", icon: Settings2 },
];

// ── Regular admin navigation ───────────────────────────────────────────────

const adminNavMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sessions",
    url: "/dashboard/sessions",
    icon: Vote,
    items: [
      { title: "All Sessions", url: "/dashboard/sessions" },
      { title: "Create Session", url: "/dashboard/sessions/create" },
    ],
  },
  {
    title: "Colleges",
    url: "/dashboard/colleges",
    icon: Building2,
    items: [{ title: "All Colleges", url: "/dashboard/colleges" }],
  },
];

const adminNavProjects = [
  { name: "Settings", url: "/dashboard/settings", icon: Settings2 },
];

// ── Flatten items for search ───────────────────────────────────────────────

function buildSearchItems(
  navMain: typeof superAdminNavMain,
  navProjects: typeof superAdminNavProjects,
): SearchItem[] {
  const results: SearchItem[] = [];

  navMain.forEach((item) => {
    if (item.items && item.items.length > 0) {
      item.items.forEach((sub) =>
        results.push({
          title: sub.title,
          url: sub.url,
          group: item.title,
          comingSoon: sub.comingSoon,
        }),
      );
    } else {
      results.push({
        title: item.title,
        url: item.url,
        group: "Navigation",
        comingSoon: item.comingSoon,
      });
    }
  });

  navProjects.forEach((p) =>
    results.push({ title: p.name, url: p.url, group: "Tools" }),
  );

  return results;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { admin } = useAuthStore();

  const isSuperAdmin = admin?.role === "super_admin";
  const navMain = isSuperAdmin ? superAdminNavMain : adminNavMain;
  const navProjects = isSuperAdmin ? superAdminNavProjects : adminNavProjects;
  const searchItems = React.useMemo(
    () => buildSearchItems(navMain, navProjects),
    [navMain, navProjects],
  );

  const user = {
    name: admin?.full_name ?? "Admin",
    email: admin?.email ?? "",
    avatar: "",
    role: admin?.role ?? "admin",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
        <NavSearch items={searchItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} label="Navigation" />
        <NavProjects projects={navProjects} label="Tools" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
