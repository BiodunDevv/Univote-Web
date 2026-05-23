"use client";

import * as React from "react";
import {
  Activity,
  Building2,
  FileText,
  Fingerprint,
  LifeBuoy,
  LayoutDashboard,
  Megaphone,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
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
import { LogoIcon } from "@/components/logo";

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

const superAdminNavMain: NavItem[] = [
  {
    title: "Overview",
    url: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    url: "/super-admin/tenants",
    icon: Building2,
    items: [
      { title: "Tenant Directory", url: "/super-admin/tenants" },
      { title: "Onboarding Queue", url: "/super-admin/onboarding" },
    ],
  },
];

const superAdminNavProjects = [
  { name: "Announcements", url: "/super-admin/announcements", icon: Megaphone },
  { name: "Testimonials", url: "/super-admin/testimonials", icon: Megaphone },
  { name: "Support", url: "/super-admin/support", icon: LifeBuoy },
  { name: "Biometrics", url: "/super-admin/biometrics", icon: Fingerprint },
  { name: "Audit Logs", url: "/super-admin/audit-logs", icon: FileText },
  { name: "System Health", url: "/super-admin/system-health", icon: Activity },
  { name: "Settings", url: "/super-admin/settings", icon: Settings2 },
];

function buildSearchItems(
  navMain: NavItem[],
  navProjects: typeof superAdminNavProjects,
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

export function SuperAdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { admin } = useAuthStore();
  useNotificationSummaryQuery("admin");
  const navMain = React.useMemo(() => superAdminNavMain, []);

  const searchItems = React.useMemo(
    () => buildSearchItems(navMain, superAdminNavProjects),
    [navMain],
  );

  const user = {
    name: admin?.full_name ?? "Super Admin",
    email: admin?.email ?? "",
    avatar: "",
    role: admin?.role ?? "super_admin",
  };
  const teams = React.useMemo(
    () => [
      {
        name: "Univote Platform",
        slug: "platform",
        logo: LogoIcon,
        active: true,
        plan: "Super Admin Console",
      },
    ],
    [],
  );

  return (
    <Sidebar collapsible="icon" data-tour="admin-sidebar" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
        <NavSearch items={searchItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} label="Platform" rootUrl="/super-admin" />
        <NavProjects projects={superAdminNavProjects} label="Operations" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} scope="super-admin" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
