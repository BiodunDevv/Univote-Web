"use client";

import { SupportDesk } from "@/components/support/support-desk";

export default function PlatformSupportPage() {
  return (
    <SupportDesk
      scope="admin"
      title="Platform Support Queue"
      description="Inspect tenant support conversations across the platform and respond where escalation is required."
      allowCreate={false}
      showTenant
      showQueueFilters
    />
  );
}
