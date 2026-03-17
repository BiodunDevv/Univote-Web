"use client";

import { NotificationFeed } from "@/components/notifications/notification-feed";

export default function PlatformNotificationsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-4xl border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Platform Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Review tenant lifecycle alerts, support escalations, and system
            events.
          </p>
        </div>
      </section>

      <NotificationFeed
        scope="admin"
        title="Platform notifications"
        description="Super-admin notifications for support and tenant changes will appear here."
        showTenant
      />
    </div>
  );
}
