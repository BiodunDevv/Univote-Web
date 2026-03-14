"use client";

import { NotificationFeed } from "@/components/notifications/notification-feed";

export default function StudentNotificationsPage() {
  return (
    <NotificationFeed
      scope="student"
      title="Notifications"
      description="Track support replies, account updates, and voting-related notices in one place."
    />
  );
}
