"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Settings2, Vote, CreditCard, Building2 } from "lucide-react";
import { type AuthSessionData, useAuthStore } from "@/lib/store/useAuthStore";
import {
  buildPublicAppUrl,
  buildTenantAuthAcceptUrl,
  isTenantHost,
} from "@/lib/tenant";
import { AdminSidebar } from "@/components/tenants/admin-sidebar";
import { DashboardShellHeader } from "@/components/dashboard-shell-header";
import { AdminProductTour } from "@/components/guided-tour/admin-product-tour";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isTenantParticipantFieldEnabled } from "@/lib/tenant-config";

function dismissWorkspaceGuide(tenantSlug: string | null) {
  if (typeof window === "undefined" || !tenantSlug) return;

  window.localStorage.setItem(`workspace-guide-complete:${tenantSlug}`, "true");
}

function shouldShowWorkspaceGuide(tenantSlug: string | null) {
  if (typeof window === "undefined" || !tenantSlug) return false;

  return window.localStorage.getItem(`workspace-guide-complete:${tenantSlug}`) !== "true";
}

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
    hasHydrated,
  } = useAuthStore();

  const currentRef = useMemo(() => {
    if (typeof window === "undefined") {
      return pathname;
    }

    return `${pathname}${window.location.search}`;
  }, [pathname]);

  const tenantSlug = tenant?.slug || null;
  const [showWorkspaceGuide, setShowWorkspaceGuide] = React.useState(false);
  const needsTenantHostRedirect =
    Boolean(tenantSlug) &&
    admin?.role !== "super_admin" &&
    !isTenantHost(tenantSlug);
  const structureEnabled =
    isTenantParticipantFieldEnabled(tenant, "college") ||
    isTenantParticipantFieldEnabled(tenant, "department");

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
      window.location.replace(handoffUrl);
    }
  }, [
    admin,
    currentRef,
    hasHydrated,
    membership,
    needsTenantHostRedirect,
    organizations,
    router,
    tenant,
    tenantSlug,
    token,
  ]);

  useEffect(() => {
    if (!hasHydrated || !tenantSlug || admin?.role === "super_admin") return;

    setShowWorkspaceGuide(shouldShowWorkspaceGuide(tenantSlug));
  }, [admin?.role, hasHydrated, tenantSlug]);

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
          <AdminProductTour scope="tenant" />
          <DashboardShellHeader />
          <div className="flex min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden p-2">
            {showWorkspaceGuide ? (
              <Card className="mb-3 border-primary/20 bg-linear-to-r from-primary/5 via-background to-background">
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Review your workspace before inviting your team
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Start with settings to confirm participant structure, then check billing and publish your first session.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" data-tour="tenant-guide-settings">
                      <Link href="/dashboard/settings">
                        <Settings2 className="mr-2 size-4" />
                        Open settings
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" data-tour="tenant-guide-billing">
                      <Link href="/dashboard/billing">
                        <CreditCard className="mr-2 size-4" />
                        Billing
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" data-tour="tenant-guide-sessions">
                      <Link href="/dashboard/sessions">
                        <Vote className="mr-2 size-4" />
                        Sessions
                      </Link>
                    </Button>
                    {structureEnabled ? (
                      <Button asChild size="sm" variant="outline" data-tour="tenant-guide-structure">
                        <Link href="/dashboard/structure/colleges">
                          <Building2 className="mr-2 size-4" />
                          Structure
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        dismissWorkspaceGuide(tenantSlug);
                        setShowWorkspaceGuide(false);
                      }}
                    >
                      Continue
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
