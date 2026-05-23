"use client";

import { useRouter } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useSupportOverviewQuery } from "@/lib/queries/support";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminChatWidgetProps = {
  supportPath?: string;
  showTenant?: boolean;
  className?: string;
};

export function AdminChatWidget({
  supportPath,
  showTenant: _showTenant = false,
  className,
}: AdminChatWidgetProps) {
  void _showTenant;
  const router = useRouter();
  const { admin } = useAuthStore();
  const overviewQuery = useSupportOverviewQuery("admin");
  const unreadTotal = overviewQuery.data?.overview.unread_total ?? 0;
  const isSuperAdmin = admin?.role === "super_admin";
  const resolvedSupportPath =
    supportPath || (isSuperAdmin ? "/super-admin/support" : "/dashboard/support");

  return (
    <Button
      variant="outline"
      className={cn("relative", className)}
      onClick={() => router.push(resolvedSupportPath)}
    >
      <LifeBuoy className="h-4 w-4" />
      <span className="hidden sm:inline">Support</span>
      <NotificationCountBadge
        count={unreadTotal}
        className="absolute -right-1.5 -top-1.5"
      />
    </Button>
  );
}
