"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LifeBuoy,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
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
import { useAuthStore } from "@/lib/store/useAuthStore";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { useNotificationSummaryQuery } from "@/lib/queries/notifications";
import { useSupportOverviewQuery } from "@/lib/queries/support";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { buildPublicAppUrl } from "@/lib/tenant";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleLabel(role: string) {
  return role === "super_admin" ? "Super Admin" : "Admin";
}

export function NavUser({
  user,
  scope = "tenant",
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    role?: string;
  };
  scope?: "tenant" | "super-admin";
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { logout, admin } = useAuthStore();
  const { data: unreadNotifications = 0 } = useNotificationSummaryQuery("admin");
  const supportOverviewQuery = useSupportOverviewQuery("admin");
  const unreadSupport = supportOverviewQuery.data?.overview.unread_total ?? 0;
  const [showLogout, setShowLogout] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const role = user.role ?? admin?.role ?? "admin";
  const abbr = initials(user.name);
  const profilePath =
    scope === "super-admin" ? "/super-admin/settings#profile" : "/dashboard/settings";
  const securityPath =
    scope === "super-admin"
      ? "/super-admin/settings#security"
      : "/dashboard/settings?tab=security";
  const settingsPath = scope === "super-admin" ? "/super-admin/settings" : "/dashboard/settings";
  const notificationsPath = scope === "super-admin" ? "/super-admin/notifications" : "/dashboard/notifications";
  const supportPath = scope === "super-admin" ? "/super-admin/support" : "/dashboard/support";

  const handleLogout = async () => {
    setLoggingOut(true);
    logout();
    await new Promise((r) => setTimeout(r, 400));
    window.location.assign(buildPublicAppUrl("/auth/signin"));
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    {abbr}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      {abbr}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{user.name}</span>
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[10px]"
                      >
                        {roleLabel(role)}
                      </Badge>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push(profilePath)}>
                  <BadgeCheck />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(securityPath)}>
                  <Shield />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(settingsPath)}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push(notificationsPath)}>
                  <Bell />
                  Notifications
                  <NotificationCountBadge
                    count={unreadNotifications}
                    className="ml-auto"
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(supportPath)}>
                  <LifeBuoy />
                  Support
                  <NotificationCountBadge count={unreadSupport} className="ml-auto" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => setShowLogout(true)}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Univote?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the sign-in page and will need to
              authenticate again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loggingOut ? (
                <LoadingButtonContent label="Signing out..." />
              ) : (
                "Sign out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
