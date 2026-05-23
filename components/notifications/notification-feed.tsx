"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Vote,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AppNotification } from "@/types/notification";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  type NotificationScope,
} from "@/lib/queries/notifications";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type NotificationFeedProps = {
  scope: NotificationScope;
  title: string;
  description: string;
  showTenant?: boolean;
};

function notificationIcon(type: string, priority: string) {
  if (type.includes("vote") || type.includes("ballot")) return Vote;
  if (type.includes("security") || type.includes("lock") || type.includes("biometric")) return ShieldAlert;
  if (type.includes("verified") || type.includes("approved") || type.includes("eligib")) return ShieldCheck;
  if (type.includes("result") || type.includes("tally")) return CheckCircle2;
  if (type.includes("feature") || type.includes("update") || type.includes("new")) return Sparkles;
  if (priority === "high") return ShieldAlert;
  return Info;
}

function priorityColor(priority: string) {
  if (priority === "high") return "border-destructive/30 bg-destructive/5 text-destructive";
  if (priority === "medium") return "border-amber-300/50 bg-amber-50/50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-400";
  return "border-border bg-muted/20 text-muted-foreground";
}

function NotificationDetailModal({
  notification,
  open,
  onClose,
}: {
  notification: AppNotification | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!notification) return null;

  const Icon = notificationIcon(notification.type, notification.priority);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm gap-0 rounded-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{notification.title}</DialogTitle>
        {/* Header band */}
        <div className="relative flex items-start gap-3 border-b bg-muted/30 px-5 py-4">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              notification.priority === "high"
                ? "border-destructive/30 bg-destructive/10"
                : notification.priority === "medium"
                  ? "border-amber-300/50 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-950/20"
                  : "border-border bg-muted/40",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                notification.priority === "high"
                  ? "text-destructive"
                  : notification.priority === "medium"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-foreground">
              {notification.title}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("text-[10px] capitalize", priorityColor(notification.priority))}
              >
                {notification.priority}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press-scale -mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-foreground">
            {notification.message}
          </p>

          {notification.link ? (
            <a
              href={notification.link}
              onClick={onClose}
              className="mt-4 flex items-center justify-center rounded-xl border bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Open link
            </a>
          ) : null}
        </div>

        {/* Footer meta */}
        <div className="border-t bg-muted/20 px-5 py-3">
          <p className="text-[11px] text-muted-foreground">
            Type: <span className="font-medium text-foreground">{notification.type.replace(/_/g, " ")}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NotificationFeed({
  scope,
  title,
  description,
  showTenant = false,
}: NotificationFeedProps) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const filters = useMemo(() => ({ unread_only: tab === "unread", limit: 40 }), [tab]);

  const notificationsQuery = useNotificationsQuery(scope, filters);
  const markRead = useMarkNotificationReadMutation(scope);
  const markAllRead = useMarkAllNotificationsReadMutation(scope);

  const notifications = notificationsQuery.data?.notifications || [];
  const unreadCount = notificationsQuery.data?.summary.unread || 0;

  const handleOpen = async (notification: AppNotification) => {
    setSelected(notification);
    if (!notification.is_read) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        // non-blocking — modal still shows
      }
    }
  };

  if (notificationsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading notifications...",
          "Preparing your inbox...",
          "Checking unread activity...",
        ]}
      />
    );
  }

  if (notificationsQuery.error) {
    return (
      <PortalEmptyState
        icon={Bell}
        title="Notifications unavailable"
        description={notificationsQuery.error.message || "Notifications are unavailable right now."}
      />
    );
  }

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Notifications"
        title={title}
        description={description}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={markAllRead.isPending || unreadCount === 0}
            onClick={async () => {
              try {
                await markAllRead.mutateAsync();
                toast.success("All notifications marked as read");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update notifications");
              }
            }}
          >
            {markAllRead.isPending ? (
              <LoadingButtonContent label="Updating..." />
            ) : (
              <>
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Mark all read
              </>
            )}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")} className="animate-slide-up-1 w-full">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-linear-to-l from-background to-transparent" />
          <TabsList
            variant="line"
            className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto border-b border-border/70 px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsTrigger value="all" className="shrink-0 px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="shrink-0 px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10">
              Unread
              {unreadCount > 0 ? (
                <span className="ml-1.5 tabular-nums text-muted-foreground">{unreadCount}</span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab} className="mt-4">
          {notifications.length === 0 ? (
            <PortalEmptyState
              icon={Bell}
              title={tab === "unread" ? "No unread notifications" : "No notifications yet"}
              description={
                tab === "unread"
                  ? "You're all caught up. Check 'All' to review past activity."
                  : "Important system, support, and voting updates will appear here."
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((notification) => {
                const Icon = notificationIcon(notification.type, notification.priority);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleOpen(notification)}
                    className={cn(
                      "press-scale group w-full rounded-2xl border text-left transition-colors hover:bg-muted/30",
                      !notification.is_read
                        ? "border-foreground/20 bg-muted/20"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      {/* Unread dot + icon */}
                      <div className="relative mt-0.5 shrink-0">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl border",
                            notification.priority === "high"
                              ? "border-destructive/30 bg-destructive/10"
                              : notification.priority === "medium"
                                ? "border-amber-300/50 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/20"
                                : "border-border bg-muted/40",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5",
                              notification.priority === "high"
                                ? "text-destructive"
                                : notification.priority === "medium"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground",
                            )}
                          />
                        </div>
                        {!notification.is_read ? (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-foreground ring-2 ring-background" />
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className={cn("text-sm font-semibold leading-snug", !notification.is_read ? "text-foreground" : "text-foreground/80")}>
                            {notification.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] capitalize", priorityColor(notification.priority))}
                          >
                            {notification.priority}
                          </Badge>
                          {showTenant && notification.tenant ? (
                            <Badge variant="secondary" className="text-[10px]">{notification.tenant.name}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NotificationDetailModal
        notification={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </PortalPage>
  );
}
