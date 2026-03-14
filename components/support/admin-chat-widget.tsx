"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  LifeBuoy,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreateSupportMessageMutation,
  useSupportConversationQuery,
  useSupportOverviewQuery,
  useSupportTicketsQuery,
  useUpdateSupportTicketMutation,
} from "@/lib/queries/support";
import { queryKeys } from "@/lib/query-keys";
import {
  emitSupportStopTyping,
  emitSupportTyping,
  getSupportSocket,
  joinSupportTicketRoom,
  leaveSupportTicketRoom,
} from "@/lib/socket/support-socket";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminChatWidgetStore } from "@/lib/store/useAdminChatWidgetStore";
import type { SupportTicket, SupportTypingEvent } from "@/types/support";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AdminChatWidgetProps = {
  supportPath: string;
  showTenant?: boolean;
  className?: string;
};

function isQueueTicket(ticket: SupportTicket, selectedTicketId: string | null) {
  return (
    ticket.status === "open" ||
    ticket.status === "in_progress" ||
    ticket.id === selectedTicketId
  );
}

export function AdminChatWidget({
  supportPath,
  showTenant = false,
  className,
}: AdminChatWidgetProps) {
  const queryClient = useQueryClient();
  const { admin } = useAuthStore();
  const { open, selectedTicketId, setOpen, setSelectedTicketId, close } =
    useAdminChatWidgetStore();
  const [search, setSearch] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [typingEvent, setTypingEvent] = useState<SupportTypingEvent | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const overviewQuery = useSupportOverviewQuery("admin");
  const ticketsQuery = useSupportTicketsQuery("admin", { limit: 50 });
  const tickets = useMemo(
    () => ticketsQuery.data?.tickets ?? [],
    [ticketsQuery.data?.tickets],
  );
  const activeSelectedTicketId =
    selectedTicketId && tickets.some((ticket) => ticket.id === selectedTicketId)
      ? selectedTicketId
      : tickets.find((ticket) => isQueueTicket(ticket, selectedTicketId))?.id || null;
  const conversationQuery = useSupportConversationQuery(
    "admin",
    activeSelectedTicketId || "",
    open && Boolean(activeSelectedTicketId),
  );
  const createMessage = useCreateSupportMessageMutation(
    "admin",
    activeSelectedTicketId || "",
  );
  const updateTicket = useUpdateSupportTicketMutation(
    "admin",
    activeSelectedTicketId || "",
  );

  const unreadTotal = overviewQuery.data?.overview.unread_total ?? 0;
  const socket = getSupportSocket("admin");
  const queueTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tickets
      .filter((ticket) => isQueueTicket(ticket, selectedTicketId))
      .filter((ticket) => {
        if (!normalizedSearch) return true;
        const haystack = [
          ticket.ticket_number,
          ticket.subject,
          ticket.requester.name,
          ticket.tenant?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort(
        (left, right) =>
          new Date(right.last_message_at).getTime() -
          new Date(left.last_message_at).getTime(),
      );
  }, [search, selectedTicketId, tickets]);
  const selectedTicket =
    conversationQuery.data?.ticket ||
    queueTickets.find((ticket) => ticket.id === activeSelectedTicketId) ||
    null;

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleSupportEvent = (payload?: { ticket_id?: string }) => {
      const eventTicketId = payload?.ticket_id;
      setTypingEvent(null);

      void queryClient.invalidateQueries({
        queryKey: queryKeys.support.overview("admin"),
      });
      void queryClient.invalidateQueries({
        queryKey: ["support", "admin", "tickets"],
      });

      if (eventTicketId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.support.messages("admin", eventTicketId),
        });
      }
    };

    const handleTyping = (payload: SupportTypingEvent) => {
      if (!activeSelectedTicketId || payload.ticket_id !== activeSelectedTicketId) return;
      if (payload.actor.id && payload.actor.id === admin?.id) return;
      setTypingEvent(payload);
    };

    const handleStopTyping = (payload: SupportTypingEvent) => {
      if (!activeSelectedTicketId || payload.ticket_id !== activeSelectedTicketId) return;
      setTypingEvent(null);
    };

    socket.on("support:ticket-created", handleSupportEvent);
    socket.on("support:ticket-updated", handleSupportEvent);
    socket.on("support:message-created", handleSupportEvent);
    socket.on("support:typing", handleTyping);
    socket.on("support:stop-typing", handleStopTyping);

    return () => {
      socket.off("support:ticket-created", handleSupportEvent);
      socket.off("support:ticket-updated", handleSupportEvent);
      socket.off("support:message-created", handleSupportEvent);
      socket.off("support:typing", handleTyping);
      socket.off("support:stop-typing", handleStopTyping);
    };
  }, [activeSelectedTicketId, admin?.id, queryClient, socket]);

  useEffect(() => {
    if (!socket || !activeSelectedTicketId || !open) {
      return undefined;
    }

    joinSupportTicketRoom(socket, activeSelectedTicketId);

    return () => {
      leaveSupportTicketRoom(socket, activeSelectedTicketId);
    };
  }, [activeSelectedTicketId, open, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleReplyBodyChange = (value: string) => {
    setReplyBody(value);

    if (!socket || !activeSelectedTicketId) {
      return;
    }

    emitSupportTyping(socket, activeSelectedTicketId);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      emitSupportStopTyping(socket, activeSelectedTicketId);
    }, 1200);
  };

  const handleSendMessage = async () => {
    if (!activeSelectedTicketId || !replyBody.trim()) return;

    try {
      await createMessage.mutateAsync({ body: replyBody.trim() });
      if (socket) {
        emitSupportStopTyping(socket, activeSelectedTicketId);
      }
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      setReplyBody("");
      setTypingEvent(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
    }
  };

  const handleStatusAction = async (status: "in_progress" | "resolved") => {
    if (!activeSelectedTicketId) return;

    try {
      await updateTicket.mutateAsync({ status });
      toast.success(
        status === "resolved" ? "Conversation marked resolved" : "Conversation is now in progress",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update ticket",
      );
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn("relative", className)}
        onClick={() => setOpen(true)}
      >
        <MessageSquareText className="h-4 w-4" />
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
          className="w-full max-w-none gap-0 p-0 sm:max-w-5xl"
        >
          <SheetHeader className="border-b border-border/70">
            <div className="flex items-start justify-between gap-3 pr-10">
              <div className="space-y-1">
                <SheetTitle className="flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4" />
                  Realtime support inbox
                </SheetTitle>
                <SheetDescription>
                  Stay inside the queue from any dashboard route, then jump into the full inbox when you need deeper triage.
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full">
                  {unreadTotal} unread
                </Badge>
                <Button variant="outline" asChild>
                  <Link href={supportPath}>Open inbox</Link>
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="grid min-h-0 flex-1 md:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-r border-border/70 md:border-b-0">
              <div className="space-y-2 border-b border-border/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Active conversations
                  </p>
                  <Badge variant="secondary" className="rounded-full">
                    {queueTickets.length}
                  </Badge>
                </div>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search queue"
                />
              </div>

              <div className="max-h-[40vh] overflow-y-auto md:max-h-[calc(100vh-8.5rem)]">
                {ticketsQuery.isLoading ? (
                  <ChangingLoadingState
                    message="Loading active conversations..."
                    className="min-h-[180px] rounded-none border-0 bg-transparent"
                  />
                ) : queueTickets.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {queueTickets.map((ticket) => {
                      const unreadCount = ticket.unread_by_admin_count || 0;

                      return (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => {
                            setSelectedTicketId(ticket.id);
                            setReplyBody("");
                            setTypingEvent(null);
                          }}
                          className={cn(
                            "w-full rounded-xl border p-2 text-left transition-colors",
                            ticket.id === activeSelectedTicketId
                              ? "border-primary/30 bg-primary/5"
                              : "border-transparent bg-transparent hover:border-border/70 hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {ticket.subject}
                                </p>
                                {unreadCount > 0 ? (
                                  <NotificationCountBadge count={unreadCount} />
                                ) : null}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {ticket.requester.name}
                                {showTenant && ticket.tenant?.name
                                  ? ` • ${ticket.tenant.name}`
                                  : ""}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline" className="rounded-full">
                                  {ticket.status.replace(/_/g, " ")}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(ticket.last_message_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 p-3 text-center">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      No active conversations
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Open tickets will appear here as soon as a student or workspace admin starts a support thread.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col">
              {activeSelectedTicketId && conversationQuery.isLoading ? (
                <ChangingLoadingState
                  messages={[
                    "Loading conversation history...",
                    "Joining support room...",
                  ]}
                  className="min-h-[320px] rounded-none border-0 bg-transparent"
                />
              ) : selectedTicket ? (
                <>
                  <div className="border-b border-border/70 p-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {selectedTicket.subject}
                          </p>
                          <Badge variant="outline" className="rounded-full">
                            {selectedTicket.ticket_number}
                          </Badge>
                          <Badge variant="secondary" className="rounded-full capitalize">
                            {selectedTicket.priority}
                          </Badge>
                          {showTenant && selectedTicket.tenant ? (
                            <Badge variant="outline" className="rounded-full">
                              {selectedTicket.tenant.name}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedTicket.requester.name} • Last updated{" "}
                          {formatDistanceToNow(new Date(selectedTicket.updatedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          disabled={
                            updateTicket.isPending ||
                            selectedTicket.status === "in_progress"
                          }
                          onClick={() => void handleStatusAction("in_progress")}
                        >
                          {updateTicket.isPending &&
                          selectedTicket.status !== "resolved" ? (
                            <LoadingButtonContent label="Updating..." />
                          ) : (
                            "Set in progress"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={
                            updateTicket.isPending ||
                            selectedTicket.status === "resolved"
                          }
                          onClick={() => void handleStatusAction("resolved")}
                        >
                          {updateTicket.isPending &&
                          selectedTicket.status !== "in_progress" ? (
                            <LoadingButtonContent label="Updating..." />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Resolve
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                    {conversationQuery.data?.messages?.length ? (
                      conversationQuery.data.messages.map((message) => {
                        const ownMessage = message.author_type === "admin";

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              ownMessage ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl border p-3",
                                ownMessage
                                  ? "border-primary/20 bg-primary/5"
                                  : "border-border/70 bg-muted/20",
                              )}
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <p className="text-xs font-semibold text-foreground">
                                  {message.author.name}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.createdAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm text-foreground">
                                {message.body}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border/70 p-3 text-center">
                        <p className="max-w-sm text-xs text-muted-foreground">
                          No messages yet. Send the first response to move the ticket forward.
                        </p>
                      </div>
                    )}
                    {typingEvent?.ticket_id === activeSelectedTicketId ? (
                      <p className="text-xs text-muted-foreground">
                        {typingEvent.actor.name} is typing...
                      </p>
                    ) : null}
                  </div>

                  <div className="border-t border-border/70 p-3">
                    <div className="space-y-2">
                      <Textarea
                        value={replyBody}
                        onChange={(event) =>
                          handleReplyBodyChange(event.target.value)
                        }
                        rows={3}
                        placeholder="Reply to this ticket without leaving the dashboard"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Messages are synced with the full support inbox in realtime.
                        </p>
                        <Button
                          onClick={() => void handleSendMessage()}
                          disabled={createMessage.isPending || !replyBody.trim()}
                        >
                          {createMessage.isPending ? (
                            <LoadingButtonContent label="Sending..." />
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
                  <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    Select a conversation
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Pick an active ticket from the queue to reply, update status, and keep the support workflow moving.
                  </p>
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
