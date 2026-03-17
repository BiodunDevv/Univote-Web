"use client";

import * as React from "react";
import {
  Activity,
  Building2,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Rocket,
  Settings2,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
import { useSupportOverviewQuery } from "@/lib/queries/support";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSearch, type SearchItem } from "@/components/nav-search";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const PlatformLogo = ({ className }: { className?: string }) => (
  <Shield className={className} />
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
  {
    title: "Support",
    url: "/super-admin/support",
    icon: LifeBuoy,
    items: [
      { title: "Support Queue", url: "/super-admin/support" },
      { title: "Notifications", url: "/super-admin/notifications" },
    ],
  },
];

const superAdminNavProjects = [
  { name: "Announcements", url: "/super-admin/announcements", icon: Megaphone },
  { name: "Testimonials", url: "/super-admin/testimonials", icon: Megaphone },
  { name: "Onboarding", url: "/super-admin/onboarding", icon: Rocket },
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
    if (item.items?.length) {
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
      url: item.url,
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
  const { data: unreadNotifications = 0 } =
    useNotificationSummaryQuery("admin");
  const supportOverviewQuery = useSupportOverviewQuery("admin");
  const unreadSupport = supportOverviewQuery.data?.overview.unread_total ?? 0;

  const navMain = React.useMemo(
    () =>
      superAdminNavMain.map((item) =>
        item.title === "Support"
          ? {
              ...item,
              badge: unreadSupport > 0 ? unreadSupport : null,
              items:
                item.items?.map((subItem) =>
                  subItem.title === "Notifications"
                    ? {
                        ...subItem,
                        badge:
                          unreadNotifications > 0 ? unreadNotifications : null,
                      }
                    : subItem.title === "Support Queue"
                      ? {
                          ...subItem,
                          badge: unreadSupport > 0 ? unreadSupport : null,
                        }
                      : subItem,
                ) || item.items,
            }
          : item,
      ),
    [unreadNotifications, unreadSupport],
  );

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

  return (
    <Sidebar collapsible="icon" data-tour="admin-sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <PlatformLogo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Univote Platform</span>
                <span className="truncate text-xs">Super Admin Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
