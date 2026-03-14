"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type NotificationFeedProps = {
  scope: NotificationScope;
  title: string;
  description: string;
  showTenant?: boolean;
};

export function NotificationFeed({
  scope,
  title,
  description,
  showTenant = false,
}: NotificationFeedProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const filters = useMemo(
    () => ({
      unread_only: tab === "unread",
      limit: 40,
    }),
    [tab],
  );

  const notificationsQuery = useNotificationsQuery(scope, filters);
  const markRead = useMarkNotificationReadMutation(scope);
  const markAllRead = useMarkAllNotificationsReadMutation(scope);

  const notifications = notificationsQuery.data?.notifications || [];
  const unreadCount = notificationsQuery.data?.summary.unread || 0;

  const handleOpen = async (notificationId: string, link?: string | null, isRead?: boolean) => {
    try {
      if (!isRead) {
        await markRead.mutateAsync(notificationId);
      }

      if (link) {
        router.push(link);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open notification");
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
      <Card className="border shadow-none">
        <CardContent className="p-3 text-sm text-muted-foreground">
          {notificationsQuery.error.message || "Notifications are unavailable right now."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-3 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-muted p-2">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{unreadCount} unread</Badge>
            <Button
              variant="outline"
              disabled={markAllRead.isPending || unreadCount === 0}
              onClick={async () => {
                try {
                  await markAllRead.mutateAsync();
                  toast.success("Notifications marked as read");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to update notifications");
                }
              }}
            >
              {markAllRead.isPending ? (
                <LoadingButtonContent label="Updating..." />
              ) : (
                <>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all read
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | "unread")}>
        <TabsList variant="line">
          <TabsTrigger value="all">All activity</TabsTrigger>
          <TabsTrigger value="unread">Unread only</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() =>
                void handleOpen(
                  notification.id,
                  notification.link,
                  notification.is_read,
                )
              }
              className={cn(
                "w-full rounded-[1.5rem] border bg-card text-left transition-colors hover:bg-muted/30",
                !notification.is_read && "border-foreground/20 bg-muted/20",
              )}
            >
              <div className="flex items-start gap-3 p-3">
                <div
                  className={cn(
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                    notification.is_read ? "bg-muted-foreground/30" : "bg-foreground",
                  )}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {notification.title}
                    </p>
                    <Badge variant="outline">{notification.priority}</Badge>
                    {showTenant && notification.tenant ? (
                      <Badge variant="secondary">{notification.tenant.name}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {!notification.is_read ? <span>Unread</span> : null}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          ))
        ) : (
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">No notifications yet</CardTitle>
              <CardDescription>
                Important system, support, and workflow updates will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
