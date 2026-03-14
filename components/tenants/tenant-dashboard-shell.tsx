"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type AuthSessionData, useAuthStore } from "@/lib/store/useAuthStore";
import {
  buildPublicAppUrl,
  buildTenantAuthAcceptUrl,
  isTenantHost,
} from "@/lib/tenant";
import { AdminSidebar } from "@/components/tenants/admin-sidebar";
import { DashboardShellHeader } from "@/components/dashboard-shell-header";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function TenantDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    token,
    admin,
    tenant,
    membership,
    organizations,
    logout,
    hasHydrated,
  } = useAuthStore();

  const currentRef = useMemo(() => {
    if (typeof window === "undefined") {
      return pathname;
    }

    return `${pathname}${window.location.search}`;
  }, [pathname]);

  const tenantSlug = tenant?.slug || null;
  const needsTenantHostRedirect =
    Boolean(tenantSlug) &&
    admin?.role !== "super_admin" &&
    !isTenantHost(tenantSlug);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !admin) {
      window.location.replace(
        buildPublicAppUrl(`/auth/signin?ref=${encodeURIComponent(currentRef)}`),
      );
      return;
    }

    if (admin.role === "super_admin") {
      router.replace("/super-admin");
      return;
    }

    if (tenantSlug && needsTenantHostRedirect) {
      const handoffSession: AuthSessionData = {
        token,
        admin,
        tenant,
        membership,
        organizations,
      };
      const handoffUrl = buildTenantAuthAcceptUrl(
        tenantSlug,
        currentRef,
        handoffSession,
      );
      logout();
      window.location.replace(handoffUrl);
    }
  }, [
    admin,
    currentRef,
    hasHydrated,
    logout,
    membership,
    needsTenantHostRedirect,
    organizations,
    router,
    tenant,
    tenantSlug,
    token,
  ]);

  if (!hasHydrated || !token || !admin) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Verifying tenant session...",
          "Preparing organisation workspace...",
          "Loading your dashboard...",
        ]}
      />
    );
  }

  if (admin.role === "super_admin" || needsTenantHostRedirect) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Checking workspace access...",
          "Routing you to the correct workspace...",
        ]}
      />
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <DashboardShellHeader />
          <div className="flex min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden p-2">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
