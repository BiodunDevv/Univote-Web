"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { buildTenantAppUrl } from "@/lib/tenant";
import { DashboardShellHeader } from "@/components/dashboard-shell-header";
import { AdminProductTour } from "@/components/guided-tour/admin-product-tour";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, admin, tenant, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !admin) {
      router.replace("/auth/signin?ref=/super-admin");
      return;
    }

    if (admin.role !== "super_admin") {
      if (tenant?.slug) {
        window.location.replace(buildTenantAppUrl(tenant.slug, "/dashboard"));
        return;
      }

      router.replace("/dashboard");
    }
  }, [admin, hasHydrated, router, tenant, token]);

  if (!hasHydrated || !token || !admin) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Verifying platform session...",
          "Loading super admin console...",
          "Preparing tenant controls...",
        ]}
      />
    );
  }

  if (admin.role !== "super_admin") {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Checking access level...",
          "Redirecting to the correct workspace...",
        ]}
      />
    );
  }

  return (
    <div className="h-svh overflow-hidden bg-background">
      <SidebarProvider
        defaultOpen
        className="h-svh overflow-hidden [--sidebar-width:16rem]"
      >
        <SuperAdminSidebar collapsible="offcanvas" />
        <SidebarInset className="min-w-0 overflow-hidden">
          <AdminProductTour scope="super-admin" />
          <DashboardShellHeader rootSegment="super-admin" />
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-2">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
