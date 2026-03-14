"use client";

import { SupportDesk } from "@/components/support/support-desk";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function TenantSupportPage() {
  const { admin } = useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";

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
