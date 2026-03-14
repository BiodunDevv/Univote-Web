"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { LifeBuoy, MessageSquarePlus, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateSupportMessageMutation,
  useCreateSupportTicketMutation,
  useSupportConversationQuery,
  useSupportOverviewQuery,
  useSupportTicketsQuery,
  useUpdateSupportTicketMutation,
} from "@/lib/queries/support";
import {
  useAdminDirectoryQuery,
  useTenantAdminUsersQuery,
} from "@/lib/queries/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type {
  SupportScope,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types/support";
import { queryKeys } from "@/lib/query-keys";
import {
  getSupportSocket,
  joinSupportTicketRoom,
  leaveSupportTicketRoom,
} from "@/lib/socket/support-socket";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

type SupportDeskProps = {
  scope: SupportScope;
  title: string;
  description: string;
  allowCreate?: boolean;
  showTenant?: boolean;
  showQueueFilters?: boolean;
};

const STATUS_OPTIONS: SupportTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

const PRIORITY_OPTIONS: SupportTicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

const CATEGORY_OPTIONS: SupportTicketCategory[] = [
  "general",
  "account",
  "voting",
  "billing",
  "technical",
];

export function SupportDesk({
  scope,
  title,
  description,
  allowCreate = true,
  showTenant = false,
  showQueueFilters = false,
}: SupportDeskProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { admin, tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [requesterType, setRequesterType] = useState<string>("all");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [manageDraft, setManageDraft] = useState<{
    ticketId: string | null;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    assignedAdminId: string;
  }>({
    ticketId: null,
    status: "open",
    priority: "medium",
    assignedAdminId: "unassigned",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: "",
    description: "",
    category: "general" as SupportTicketCategory,
    priority: "medium" as SupportTicketPriority,
  });

  const overviewQuery = useSupportOverviewQuery(scope);
  const ticketsQuery = useSupportTicketsQuery(scope, {
    search,
    status: statusFilter === "all" ? undefined : statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    requester_type: requesterType === "all" ? undefined : requesterType,
    assigned_to_me: showQueueFilters ? assignedToMe : undefined,
    limit: 50,
  });
  const tickets = useMemo(
    () => ticketsQuery.data?.tickets ?? [],
    [ticketsQuery.data?.tickets],
  );
  const deepLinkedTicketId = searchParams.get("ticket");
  const effectiveSelectedTicketId =
    deepLinkedTicketId && tickets.some((ticket) => ticket.id === deepLinkedTicketId)
      ? deepLinkedTicketId
      : selectedTicketId && tickets.some((ticket) => ticket.id === selectedTicketId)
        ? selectedTicketId
        : tickets[0]?.id ?? null;
  const conversationQuery = useSupportConversationQuery(
    scope,
    effectiveSelectedTicketId || "",
    Boolean(effectiveSelectedTicketId),
  );
  const createTicket = useCreateSupportTicketMutation(scope);
  const updateTicket = useUpdateSupportTicketMutation(
    scope,
    effectiveSelectedTicketId || "",
  );
  const createMessage = useCreateSupportMessageMutation(
    scope,
    effectiveSelectedTicketId || "",
  );

  const canManage = overviewQuery.data?.permissions.can_manage ?? false;
  const canCreate = allowCreate && (overviewQuery.data?.permissions.can_create ?? true);
  const selectedConversation = conversationQuery.data;
  const isAdminScope = scope === "admin";
  const isSuperAdmin = admin?.role === "super_admin";

  const tenantAdminQuery = useTenantAdminUsersQuery(
    {
      page: 1,
      limit: 100,
      is_active: true,
    },
    {
      enabled: isAdminScope && canManage && !isSuperAdmin,
    },
  );
  const globalAdminQuery = useAdminDirectoryQuery(
    {
      page: 1,
      limit: 100,
      is_active: true,
    },
    {
      enabled: isAdminScope && canManage && isSuperAdmin,
    },
  );

  useEffect(() => {
    const socketScope = scope === "student" ? "student" : "admin";
    const socket = getSupportSocket(socketScope);

    if (!socket) {
      return undefined;
    }

    const handleSupportEvent = (payload?: { ticket_id?: string }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.support.overview(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: ["support", scope, "tickets"],
      });

      const eventTicketId = payload?.ticket_id;
      if (
        effectiveSelectedTicketId &&
        (!eventTicketId || eventTicketId === effectiveSelectedTicketId)
      ) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.support.messages(scope, effectiveSelectedTicketId),
        });
      }
    };

    socket.on("support:ticket-created", handleSupportEvent);
    socket.on("support:ticket-updated", handleSupportEvent);
    socket.on("support:message-created", handleSupportEvent);

    if (effectiveSelectedTicketId) {
      joinSupportTicketRoom(socket, effectiveSelectedTicketId);
    }

    return () => {
      socket.off("support:ticket-created", handleSupportEvent);
      socket.off("support:ticket-updated", handleSupportEvent);
      socket.off("support:message-created", handleSupportEvent);

      if (effectiveSelectedTicketId) {
        leaveSupportTicketRoom(socket, effectiveSelectedTicketId);
      }
    };
  }, [effectiveSelectedTicketId, queryClient, scope]);

  const metrics = useMemo(
    () => [
      { label: "Total", value: overviewQuery.data?.overview.total ?? "--" },
      { label: "Open", value: overviewQuery.data?.overview.open ?? "--" },
      { label: "In progress", value: overviewQuery.data?.overview.in_progress ?? "--" },
      { label: "Resolved", value: overviewQuery.data?.overview.resolved ?? "--" },
      { label: "Closed", value: overviewQuery.data?.overview.closed ?? "--" },
      { label: "Unassigned", value: overviewQuery.data?.overview.unassigned ?? "--" },
    ],
    [overviewQuery.data?.overview],
  );

  const assignableAdmins = useMemo(() => {
    if (!isAdminScope || !canManage) {
      return [];
    }

    if (isSuperAdmin) {
      return (globalAdminQuery.data?.admins || []).map((entry) => ({
        id: entry._id,
        label: `${entry.full_name} (${entry.role.replace(/_/g, " ")})`,
      }));
    }

    return (tenantAdminQuery.data?.members || []).map((member) => ({
      id: member.admin_id,
      label: `${member.full_name} (${member.role})`,
    }));
  }, [
    canManage,
    globalAdminQuery.data?.admins,
    isAdminScope,
    isSuperAdmin,
    tenantAdminQuery.data?.members,
  ]);
  const manageStatus =
    manageDraft.ticketId === effectiveSelectedTicketId
      ? manageDraft.status
      : selectedConversation?.ticket.status || "open";
  const managePriority =
    manageDraft.ticketId === effectiveSelectedTicketId
      ? manageDraft.priority
      : selectedConversation?.ticket.priority || "medium";
  const manageAssignedAdminId =
    manageDraft.ticketId === effectiveSelectedTicketId
      ? manageDraft.assignedAdminId
      : selectedConversation?.ticket.assigned_admin?.id || "unassigned";

  const handleCreateTicket = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await createTicket.mutateAsync(createForm);
      toast.success("Support ticket created");
      setCreateOpen(false);
      setCreateForm({
        subject: "",
        description: "",
        category: "general",
        priority: "medium",
      });
      if (response.ticket?.id) {
        setSelectedTicketId(response.ticket.id);
        setManageDraft({
          ticketId: response.ticket.id,
          status: "open",
          priority: createForm.priority,
          assignedAdminId: "unassigned",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create ticket");
    }
  };

  const handleSendMessage = async () => {
    if (!effectiveSelectedTicketId || !replyBody.trim()) return;

    try {
      await createMessage.mutateAsync({ body: replyBody.trim() });
      setReplyBody("");
      toast.success("Message sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  const handleUpdateTicket = async (status?: SupportTicketStatus) => {
    if (!effectiveSelectedTicketId) return;

    try {
      await updateTicket.mutateAsync({
        status: status || manageStatus,
        priority: canManage ? managePriority : undefined,
        assigned_admin_id: canManage
          ? manageAssignedAdminId === "unassigned"
            ? null
            : manageAssignedAdminId
          : undefined,
      });
      toast.success("Ticket updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update ticket");
    }
  };

  if (overviewQuery.isLoading || ticketsQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading support tickets...",
          "Preparing conversation history...",
          "Checking support queue metrics...",
        ]}
      />
    );
  }

  const topLevelError = overviewQuery.error?.message || ticketsQuery.error?.message;

  return (
    <div className="space-y-3">
      <section className="flex flex-col gap-3 rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-3 shadow-none lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {canCreate ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <MessageSquarePlus className="mr-2 size-4" />
                New ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create support ticket</DialogTitle>
                <DialogDescription>
                  Open a new support conversation and describe the issue clearly.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input
                    id="support-subject"
                    value={createForm.subject}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={createForm.category}
                      onValueChange={(value) =>
                        setCreateForm((current) => ({
                          ...current,
                          category: value as SupportTicketCategory,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={createForm.priority}
                      onValueChange={(value) =>
                        setCreateForm((current) => ({
                          ...current,
                          priority: value as SupportTicketPriority,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-description">Description</Label>
                  <Textarea
                    id="support-description"
                    value={createForm.description}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={7}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createTicket.isPending}>
                    {createTicket.isPending ? (
                      <LoadingButtonContent label="Creating ticket..." />
                    ) : (
                      "Create ticket"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </section>

      {topLevelError ? (
        <Card className="border-destructive/40 shadow-none">
          <CardContent className="p-3 text-sm text-muted-foreground">
            {topLevelError}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((item) => (
          <Card key={item.label} className="border shadow-none">
            <CardContent className="p-2">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border shadow-none">
          <CardHeader className="gap-4">
            <div>
              <CardTitle>Ticket queue</CardTitle>
              <CardDescription>
                Review active support requests and select a thread to continue.
              </CardDescription>
            </div>
            <div className="grid gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subject, requester, or ticket number"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showQueueFilters ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Select value={requesterType} onValueChange={setRequesterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Requester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All requesters</SelectItem>
                      <SelectItem value="student">
                        {participantLabels.plural}
                      </SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm">
                    <Checkbox
                      checked={assignedToMe}
                      onCheckedChange={(checked) => setAssignedToMe(Boolean(checked))}
                    />
                    <span>Assigned to me</span>
                  </label>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.map((ticket) => {
              const unreadCount =
                scope === "student"
                  ? ticket.unread_by_requester_count
                  : ticket.unread_by_admin_count;

              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setManageDraft({
                      ticketId: ticket.id,
                      status: ticket.status,
                      priority: ticket.priority,
                      assignedAdminId: ticket.assigned_admin?.id || "unassigned",
                    });
                  }}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                    effectiveSelectedTicketId === ticket.id
                      ? "border-foreground bg-muted/30"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{ticket.ticket_number}</Badge>
                      <Badge variant="secondary">{ticket.status.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline">{ticket.priority}</Badge>
                      {showTenant && ticket.tenant ? (
                        <Badge variant="secondary">{ticket.tenant.slug}</Badge>
                      ) : null}
                    </div>
                    {unreadCount > 0 ? <Badge>{unreadCount} new</Badge> : null}
                  </div>
                  <div className="mt-3">
                    <p className="font-medium text-foreground">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.requester.name}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {ticket.last_message_preview || ticket.description}
                    </p>
                    {ticket.assigned_admin ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Assigned to {ticket.assigned_admin.name}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(ticket.last_message_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })}
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                No support tickets match the current filter.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Review the selected ticket and continue the support thread.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!effectiveSelectedTicketId ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-3 text-center">
                <LifeBuoy className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a ticket from the queue to view the full conversation.
                </p>
              </div>
            ) : conversationQuery.isLoading ? (
              <ChangingLoadingState
                messages={[
                  "Loading support conversation...",
                  "Pulling message history...",
                ]}
              />
            ) : selectedConversation ? (
              <>
                <div className="rounded-2xl border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{selectedConversation.ticket.ticket_number}</Badge>
                    <Badge variant="secondary">
                      {selectedConversation.ticket.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline">{selectedConversation.ticket.category}</Badge>
                    <Badge variant="outline">{selectedConversation.ticket.priority}</Badge>
                    {showTenant && selectedConversation.ticket.tenant ? (
                      <Badge variant="secondary">
                        {selectedConversation.ticket.tenant.slug}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedConversation.ticket.subject}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requester: {selectedConversation.ticket.requester.name}
                    </p>
                    {selectedConversation.ticket.assigned_admin ? (
                      <p className="text-sm text-muted-foreground">
                        Assigned to: {selectedConversation.ticket.assigned_admin.name}
                      </p>
                    ) : null}
                  </div>
                </div>

                {canManage ? (
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <Select
                      value={manageStatus}
                      onValueChange={(value) =>
                        setManageDraft({
                          ticketId: effectiveSelectedTicketId,
                          status: value as SupportTicketStatus,
                          priority: managePriority,
                          assignedAdminId: manageAssignedAdminId,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={managePriority}
                      onValueChange={(value) =>
                        setManageDraft({
                          ticketId: effectiveSelectedTicketId,
                          status: manageStatus,
                          priority: value as SupportTicketPriority,
                          assignedAdminId: manageAssignedAdminId,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={manageAssignedAdminId}
                      onValueChange={(value) =>
                        setManageDraft({
                          ticketId: effectiveSelectedTicketId,
                          status: manageStatus,
                          priority: managePriority,
                          assignedAdminId: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign ticket" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {assignableAdmins.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => void handleUpdateTicket()}
                      disabled={
                        updateTicket.isPending ||
                        tenantAdminQuery.isLoading ||
                        globalAdminQuery.isLoading
                      }
                    >
                      {updateTicket.isPending ? (
                        <LoadingButtonContent label="Saving..." />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                ) : selectedConversation.ticket.status !== "closed" ? (
                  <Button
                    variant="outline"
                    onClick={() => void handleUpdateTicket("closed")}
                    disabled={updateTicket.isPending}
                  >
                    {updateTicket.isPending ? (
                      <LoadingButtonContent label="Closing..." />
                    ) : (
                      "Close ticket"
                    )}
                  </Button>
                ) : null}

                <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border bg-muted/10 p-3">
                  {selectedConversation.messages.map((message) => {
                    const isOwn =
                      (scope === "student" && message.author_type === "student") ||
                      (scope === "admin" && message.author_type === "admin");

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm ${
                            isOwn
                              ? "bg-foreground text-background"
                              : "border bg-background text-foreground"
                          }`}
                        >
                          <p className="font-medium">{message.author.name}</p>
                          <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                          <p
                            className={`mt-2 text-xs ${
                              isOwn ? "text-background/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write your message..."
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => void handleSendMessage()}
                      disabled={createMessage.isPending || !replyBody.trim()}
                    >
                      {createMessage.isPending ? (
                        <LoadingButtonContent label="Sending reply..." />
                      ) : (
                        <>
                          <Send className="mr-2 size-4" />
                          Send reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
                {(conversationQuery.error as Error | undefined)?.message ||
                  "Support conversation is unavailable right now."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
