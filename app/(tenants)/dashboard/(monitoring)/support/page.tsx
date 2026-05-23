"use client";

import { SupportDesk } from "@/components/support/support-desk";

export default function TenantSupportPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 pb-4">
      <SupportDesk
        scope="admin"
        title="Support inbox"
        description="Review support requests, reply to conversations, and keep assignment and status updates moving."
        allowCreate
        showQueueFilters
      />
    </div>
  );
}
