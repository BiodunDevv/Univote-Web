"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, LifeBuoy, MessageSquareText } from "lucide-react";
import {
  useSupportOverviewQuery,
  useSupportTicketsQuery,
} from "@/lib/queries/support";
import { useAdminChatWidgetStore } from "@/lib/store/useAdminChatWidgetStore";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AdminChatOverviewCardProps = {
  supportPath: string;
  showTenant?: boolean;
};

export function AdminChatOverviewCard({
  supportPath,
  showTenant = false,
}: AdminChatOverviewCardProps) {
  const { openTicket } = useAdminChatWidgetStore();
  const overviewQuery = useSupportOverviewQuery("admin");
  const ticketsQuery = useSupportTicketsQuery("admin", { limit: 12 });

  const activeTickets = (ticketsQuery.data?.tickets || [])
    .filter((ticket) => ticket.status === "open" || ticket.status === "in_progress")
    .sort(
      (left, right) =>
        new Date(right.last_message_at).getTime() -
        new Date(left.last_message_at).getTime(),
    );
  const latestTicket = activeTickets[0] || null;

  if (overviewQuery.isLoading || ticketsQuery.isLoading) {
    return (
      <Card className="border-border/70 shadow-none">
        <CardContent className="p-2">
          <ChangingLoadingState
            message="Loading support overview..."
            className="min-h-[180px] rounded-xl border-0 bg-transparent"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Realtime support
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Keep active conversations moving
              </p>
              <NotificationCountBadge
                count={overviewQuery.data?.overview.unread_total}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Review the queue, jump into the compact chat panel, or open the full support inbox.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/30 p-2 text-muted-foreground">
            <LifeBuoy className="h-4 w-4" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Active
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {activeTickets.length}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Unread
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {overviewQuery.data?.overview.unread_total ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Unassigned
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {overviewQuery.data?.overview.unassigned ?? 0}
            </p>
          </div>
        </div>

        {latestTicket ? (
          <button
            type="button"
            onClick={() => openTicket(latestTicket.id)}
            className="w-full rounded-xl border border-border/70 bg-muted/20 p-2 text-left transition-colors hover:bg-muted/35"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {latestTicket.subject}
                  </p>
                  <Badge variant="outline" className="rounded-full">
                    {latestTicket.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {latestTicket.requester.name}
                  {showTenant && latestTicket.tenant?.name
                    ? ` • ${latestTicket.tenant.name}`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated{" "}
                  {formatDistanceToNow(new Date(latestTicket.last_message_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background p-2 text-muted-foreground">
                <MessageSquareText className="h-4 w-4" />
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              No active conversations yet. New support threads will surface here automatically.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openTicket(latestTicket?.id ?? null)}>
            Open compact chat
          </Button>
          <Button variant="ghost" asChild>
            <Link href={supportPath}>
              Full inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
