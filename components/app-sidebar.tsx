"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Vote,
  Users,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { LogoIcon } from "@/components/logo";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { logout, admin } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/auth/signin");
  };

  const navSecondary = [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Logout",
      icon: LogOut,
      onClick: handleLogout,
    },
  ];

  // Get user data from auth store or use default
  const userData = admin
    ? {
        name: admin.full_name || "Admin",
        email: admin.email,
        avatar: "", // No avatar from backend, will use initials
      }
    : {
        name: "Guest",
        email: "guest@example.com",
        avatar: "",
      };

  // Filter projects based on role
  const availableProjects =
    admin?.role === "super_admin"
      ? [
          {
            name: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            name: "Admin Management",
            url: "/dashboard/admins",
            icon: UserCog,
          },
          {
            name: "Elections",
            url: "/dashboard/sessions",
            icon: Vote,
          },

          {
            name: "Colleges & Departments",
            url: "/dashboard/colleges",
            icon: Building2,
          },
          {
            name: "Reports / Results",
            url: "/dashboard/sessions",
            icon: BarChart3,
          },
        ]
      : [
          {
            name: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            name: "Elections",
            url: "/dashboard/sessions",
            icon: Vote,
          },

          {
            name: "Colleges & Departments",
            url: "/dashboard/colleges",
            icon: Building2,
          },
          {
            name: "Reports / Results",
            url: "/dashboard/sessions",
            icon: BarChart3,
          },
        ];

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a>
                <div className="flex size-8 items-center justify-center rounded-lg">
                  <LogoIcon />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Univote</span>
                  <span className="truncate text-xs">Campus Voting</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={availableProjects} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
