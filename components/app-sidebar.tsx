"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Vote,
  UserCog,
  Settings,
  LogOut,
  Building2,
  Loader2,
  FileText,
  Scan,
  Users,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AnimatedThemeToggler } from "@/components/theme-toggler";

import { LogoIcon } from "@/components/logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { logout, admin, token } = useAuthStore();
  const { dashboardData, fetchQuickStats } = useDashboardStore();
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [favoritesOpen, setFavoritesOpen] = React.useState(true);

  // Fetch dashboard stats when component mounts
  React.useEffect(() => {
    if (token) {
      fetchQuickStats(token);
    }
  }, [token, fetchQuickStats]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/auth/signin");
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userData = admin
    ? {
        name: admin.full_name || "Admin",
        email: admin.email,
        initials: getInitials(admin.full_name || "Admin"),
      }
    : {
        name: "Guest",
        email: "guest@example.com",
        initials: "GU",
      };

  // Main navigation items
  const mainNavItems =
    admin?.role === "super_admin"
      ? [
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
            name: "Colleges",
            url: "/dashboard/colleges",
            icon: Building2,
          },
          {
            name: "Admins",
            url: "/dashboard/admins",
            icon: UserCog,
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
            name: "Colleges",
            url: "/dashboard/colleges",
            icon: Building2,
          },
        ];

  const favoriteItems = [
    {
      name: "Active Sessions",
      count: dashboardData?.overview?.active_sessions || 0,
      icon: Vote,
    },
    {
      name: "Total Students",
      count: dashboardData?.overview?.total_students || 0,
      icon: Users,
    },
    {
      name: "Colleges",
      count: dashboardData?.overview?.total_colleges || 0,
      icon: Building2,
    },
  ];

  return (
    <>
      <Sidebar className="border-r" {...props}>
        <SidebarHeader className="border-b">
          <div className="flex h-14 items-center justify-between px-3">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={handleLinkClick}
            >
              <div className="flex h-9 w-9 items-center justify-center">
                <LogoIcon />
              </div>
              {state === "expanded" && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Univote</span>
                  <span className="text-xs text-muted-foreground">
                    Voting Platform
                  </span>
                </div>
              )}
            </Link>
            {state === "expanded" && <div className="flex h-8 w-8" />}
          </div>

          {state === "expanded" && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userData.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{userData.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      router.push("/dashboard/settings");
                      handleLinkClick();
                    }}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push("/dashboard/settings");
                      handleLinkClick();
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogoutClick}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className="flex items-center gap-3 px-3 py-2"
                    onClick={handleLinkClick}
                  >
                    <item.icon className="h-4 w-4" />
                    {state === "expanded" && (
                      <span className="text-sm">{item.name}</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          {state === "expanded" && (
            <>
              <Separator className="my-4" />

              {/* Favorites Section */}
              <div className="mt-4 px-2">
                <Collapsible
                  open={favoritesOpen}
                  onOpenChange={setFavoritesOpen}
                >
                  <div className="flex items-center justify-between px-2 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Favorites
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent">
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                      <CollapsibleTrigger asChild>
                        <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent">
                          <Plus className="h-3 w-3" />
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent className="space-y-1">
                    {favoriteItems.map((item) => (
                      <button
                        key={item.name}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <div className="w-full">
                  <AnimatedThemeToggler
                    variant="with-text"
                    className="w-full justify-start"
                  />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3"
                  onClick={handleLinkClick}
                >
                  <Settings className="h-4 w-4" />
                  {state === "expanded" && (
                    <span className="text-sm">Settings</span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogoutClick}>
                <LogOut className="h-4 w-4" />
                {state === "expanded" && (
                  <span className="text-sm">Logout</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
            <AlertDialogCancel disabled={isLoggingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
