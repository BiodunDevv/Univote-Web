"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Vote,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Loader2,
  FileText,
  Scan,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { logout, admin } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX
    router.push("/auth/signin");
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const navSecondary = [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Logout",
      icon: LogOut,
      onClick: handleLogoutClick,
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
          {
            name: "Audit Logs",
            url: "/dashboard/audit-logs",
            icon: FileText,
          },
          {
            name: "Face++ Test",
            url: "/dashboard/facepp-test",
            icon: Scan,
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
    <>
      <Sidebar className="h-screen border-r" {...props}>
        <SidebarHeader className="border-b py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild className="h-11">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg">
                    <LogoIcon />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">
                      Univote
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      Campus Voting
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="py-2">
          <NavProjects projects={availableProjects} />
          <NavSecondary items={navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter className="border-t py-2">
          <NavUser user={userData} />
        </SidebarFooter>
      </Sidebar>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to sign in again to
              access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9" disabled={isLoggingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
