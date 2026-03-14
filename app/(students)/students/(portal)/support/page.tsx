"use client";

import { SupportDesk } from "@/components/support/support-desk";

export default function StudentSupportPage() {
  return (
    <SupportDesk
      scope="student"
      title="Support"
      description="Open a support ticket, follow replies, and keep your voting issues tracked in one thread."
      allowCreate
      showQueueFilters={false}
    />
  );
}
