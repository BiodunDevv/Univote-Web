"use client";

import { SupportDesk } from "@/components/support/support-desk";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { TenantAccessRestricted } from "@/components/tenants/shared";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

export default function TenantSupportPage() {
  const { admin, membership } = useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";
  const canManageSupport = isSuperAdmin
    ? true
    : hasAnyTenantPermission(membership, ["support.manage", "tenant.manage"]);

  if (!canManageSupport) {
    return (
      <TenantAccessRestricted
        title="Support access restricted"
        subtitle="Your university role does not allow support queue management."
      />
    );
  }

  return (
    <SupportDesk
      scope="admin"
      title={isSuperAdmin ? "Support Queue" : "Support Inbox"}
      description={
        isSuperAdmin
          ? "Inspect support tickets across tenants from the dashboard shell."
          : "Manage tenant support tickets, continue ticket conversations, and track queue posture."
      }
      allowCreate={!isSuperAdmin}
      showTenant={isSuperAdmin}
      showQueueFilters
    />
  );
}
