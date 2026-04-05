"use client";

import { LifeBuoy } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminChatWidgetStore } from "@/lib/store/useAdminChatWidgetStore";
import { useSupportOverviewQuery } from "@/lib/queries/support";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { SupportDesk } from "@/components/support/support-desk";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AdminChatWidgetProps = {
  supportPath?: string;
  showTenant?: boolean;
  className?: string;
};

export function AdminChatWidget({
  supportPath: _supportPath,
  showTenant = false,
  className,
}: AdminChatWidgetProps) {
  void _supportPath;
  const { admin } = useAuthStore();
  const { open, selectedTicketId, setOpen, close } = useAdminChatWidgetStore();
  const overviewQuery = useSupportOverviewQuery("admin");
  const unreadTotal = overviewQuery.data?.overview.unread_total ?? 0;
  const isSuperAdmin = admin?.role === "super_admin";

  return (
    <>
      <Button
        variant="outline"
        className={cn("relative", className)}
        onClick={() => setOpen(true)}
      >
        <LifeBuoy className="h-4 w-4" />
        <span className="hidden sm:inline">Support</span>
        <NotificationCountBadge
          count={unreadTotal}
          className="absolute -right-1.5 -top-1.5"
        />
      </Button>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            close();
            return;
          }

          setOpen(true);
        }}
      >
        <SheetContent
          side="right"
          className="w-screen max-w-none gap-0 p-0 sm:w-[92vw] sm:max-w-6xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Support inbox</SheetTitle>
            <SheetDescription>
              Review support tickets, reply to conversations, and manage queue
              status without leaving the current page.
            </SheetDescription>
          </SheetHeader>

          <SupportDesk
            scope="admin"
            title={isSuperAdmin ? "Platform Support Queue" : "Support Inbox"}
            description={
              isSuperAdmin
                ? "Inspect tenant support logs across the platform in oversight mode. Message content and tenant-side moderation actions stay inside each tenant workspace."
                : "Manage tenant support tickets, continue conversations, and keep queue status current."
            }
            allowCreate={!isSuperAdmin}
            showTenant={showTenant}
            showQueueFilters
            preferredTicketId={selectedTicketId}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
