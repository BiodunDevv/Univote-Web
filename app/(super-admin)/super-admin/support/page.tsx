"use client";

import { LifeBuoy, Shield } from "lucide-react";
import { SupportDesk } from "@/components/support/support-desk";
import { TenantPageHeader } from "@/components/tenants/shared";

export default function SuperAdminSupportPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
      <TenantPageHeader
        eyebrow="Platform operations"
        icon={<LifeBuoy className="h-5 w-5" />}
        title="Platform support"
        subtitle="Review tenant support activity across the platform in oversight mode, monitor queue posture, and inspect escalations without stepping into tenant moderation actions."
        stats={[
          { label: "Scope", value: "All tenants" },
          { label: "Mode", value: "Oversight" },
        ]}
        badges={
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Shield className="h-3 w-3" />
            Audit-only replies disabled
          </span>
        }
      />

      <SupportDesk
        scope="admin"
        title="Platform support queue"
        description="Inspect tenant support logs across the platform. Message content and moderation remain inside each tenant workspace."
        allowCreate={false}
        showTenant
        showQueueFilters
      />
    </div>
  );
}
