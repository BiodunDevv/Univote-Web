"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  LifeBuoy,
  ListFilter,
  MessageSquarePlus,
  Send,
  XCircle,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  compact?: boolean;
  fullScreen?: boolean;
  preferredTicketId?: string | null;
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
  "technical",
];

export function SupportDesk({
  scope,
  title,
  description,
  allowCreate = true,
  showTenant = false,
  showQueueFilters = false,
  compact = false,
  fullScreen = false,
  preferredTicketId = null,
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
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [ticketAction, setTicketAction] = useState<
    "save" | "close" | "approve" | "decline" | null
  >(null);
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
  const prefillCreate = searchParams.get("create");
  const prefillSubject = searchParams.get("subject");
  const prefillDescription = searchParams.get("description");
  const prefillCategory = searchParams.get("category");
  const effectiveSelectedTicketId =
    deepLinkedTicketId &&
    tickets.some((ticket) => ticket.id === deepLinkedTicketId)
      ? deepLinkedTicketId
      : preferredTicketId &&
          tickets.some((ticket) => ticket.id === preferredTicketId)
        ? preferredTicketId
      : selectedTicketId &&
          tickets.some((ticket) => ticket.id === selectedTicketId)
        ? selectedTicketId
        : (tickets[0]?.id ?? null);
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

  const isAdminScope = scope === "admin";
  const isSuperAdmin = admin?.role === "super_admin";
  const canManage = overviewQuery.data?.permissions.can_manage ?? false;
  const canModerateQueue = canManage && !isSuperAdmin;
  const canCreate =
    allowCreate && (overviewQuery.data?.permissions.can_create ?? true);
  const selectedConversation = conversationQuery.data;
  void compact;
  void fullScreen;
  const isPhotoResetTicket = Boolean(
    selectedConversation &&
      selectedConversation.ticket.requester_type === "student" &&
      selectedConversation.ticket.category === "account" &&
      /photo reset/i.test(selectedConversation.ticket.subject),
  );
  const photoResetDecisionStatus =
    selectedConversation?.ticket.photo_reset_decision_status ?? null;
  const canReviewPhotoReset = Boolean(
    canModerateQueue &&
      isPhotoResetTicket &&
      selectedConversation &&
      photoResetDecisionStatus !== "approved" &&
      photoResetDecisionStatus !== "declined" &&
      !["resolved", "closed"].includes(selectedConversation.ticket.status),
  );
  const isAuditOnlyView = isAdminScope && isSuperAdmin;

  const tenantAdminQuery = useTenantAdminUsersQuery(
    {
      page: 1,
      limit: 100,
      is_active: true,
    },
    {
      enabled: isAdminScope && canModerateQueue,
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
          queryKey: queryKeys.support.messages(
            scope,
            effectiveSelectedTicketId,
          ),
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
      {
        label: "In progress",
        value: overviewQuery.data?.overview.in_progress ?? "--",
      },
      {
        label: "Resolved",
        value: overviewQuery.data?.overview.resolved ?? "--",
      },
      { label: "Closed", value: overviewQuery.data?.overview.closed ?? "--" },
      {
        label: "Unassigned",
        value: overviewQuery.data?.overview.unassigned ?? "--",
      },
    ],
    [overviewQuery.data?.overview],
  );

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
      toast.error(
        error instanceof Error ? error.message : "Failed to create ticket",
      );
    }
  };

  const handleSendMessage = async () => {
    if (!effectiveSelectedTicketId || !replyBody.trim()) return;

    try {
      await createMessage.mutateAsync({ body: replyBody.trim() });
      setReplyBody("");
      toast.success("Message sent");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
    }
  };

  const handleUpdateTicket = async (status?: SupportTicketStatus) => {
    if (!effectiveSelectedTicketId) return;

    try {
      setTicketAction(status === "closed" ? "close" : "save");
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
      toast.error(
        error instanceof Error ? error.message : "Failed to update ticket",
      );
    } finally {
      setTicketAction(null);
    }
  };

  const handleResetPhotoCooldown = async () => {
    if (!effectiveSelectedTicketId) return;

    try {
      setTicketAction("save");
      await updateTicket.mutateAsync({
        profile_photo_reset: true,
      });
      toast.success("Student photo reset unlocked");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset photo lock",
      );
    } finally {
      setTicketAction(null);
    }
  };

  const handlePhotoResetDecision = async (
    decision: "accepted" | "declined",
  ) => {
    if (!effectiveSelectedTicketId) return;

    try {
      setTicketAction(decision === "accepted" ? "approve" : "decline");
      await updateTicket.mutateAsync({
        photo_reset_decision: decision,
      });
      toast.success(
        decision === "accepted"
          ? "Photo reset request approved"
          : "Photo reset request declined",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update photo reset request",
      );
    } finally {
      setTicketAction(null);
    }
  };

  useEffect(() => {
    if (!canCreate || prefillCreate !== "1") return;

    setCreateOpen(true);
    setCreateForm((current) => ({
      ...current,
      subject: prefillSubject || current.subject,
      description: prefillDescription || current.description,
      category: CATEGORY_OPTIONS.includes(
        (prefillCategory || current.category) as SupportTicketCategory,
      )
        ? ((prefillCategory || current.category) as SupportTicketCategory)
        : current.category,
    }));
  }, [
    canCreate,
    prefillCategory,
    prefillCreate,
    prefillDescription,
    prefillSubject,
  ]);

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

  const topLevelError =
    overviewQuery.error?.message || ticketsQuery.error?.message;

  // Shared ticket row renderer
  const renderTicketRow = (
    ticket: (typeof tickets)[number],
    onSelect?: () => void,
  ) => {
    const unreadCount =
      scope === "student"
        ? ticket.unread_by_requester_count
        : ticket.unread_by_admin_count;
    const isActive = effectiveSelectedTicketId === ticket.id;

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
          onSelect?.();
        }}
        className={cn(
          "w-full min-w-0 overflow-hidden rounded-2xl px-3 py-2.5 text-left transition-colors",
          isActive ? "bg-foreground text-background" : "hover:bg-muted/40",
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm font-medium",
              isActive ? "text-background" : "text-foreground",
            )}
          >
            {ticket.subject}
          </p>
          {unreadCount > 0 ? (
            <Badge className="shrink-0 text-[10px]">{unreadCount}</Badge>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Badge
            variant={isActive ? "outline" : "secondary"}
            className="text-[10px]"
          >
            {ticket.status.replace(/_/g, " ")}
          </Badge>
          <Badge
            variant={isActive ? "outline" : "outline"}
            className="text-[10px]"
          >
            {ticket.priority}
          </Badge>
          {showTenant && ticket.tenant ? (
            <Badge variant="outline" className="text-[10px]">
              {ticket.tenant.slug}
            </Badge>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-1 line-clamp-1 text-xs",
            isActive ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {formatDistanceToNow(new Date(ticket.last_message_at), {
            addSuffix: true,
          })}
        </p>
      </button>
    );
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-4 pb-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border/70 px-3 py-3 shadow-none"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="min-h-[58rem] rounded-2xl border border-border/70">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                {description}
              </p>
            </div>
            {canCreate ? (
              <Button
                size="sm"
                className="h-8 shrink-0"
                onClick={() => setCreateOpen(true)}
              >
                <MessageSquarePlus className="mr-1.5 size-3.5" />
                New ticket
              </Button>
            ) : null}
          </div>

          <div className="grid gap-2 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.8fr))]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets, requesters, or ticket numbers…"
              className="h-9 text-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm">
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
              <SelectTrigger className="h-9 text-sm">
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
            {showQueueFilters ? (
              <Select value={requesterType} onValueChange={setRequesterType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Requester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All requesters</SelectItem>
                  <SelectItem value="student">{participantLabels.plural}</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {showQueueFilters ? (
            <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs text-muted-foreground">
              <Checkbox
                checked={assignedToMe}
                onCheckedChange={(checked) => setAssignedToMe(Boolean(checked))}
              />
              <span>Assigned to me</span>
            </label>
          ) : null}
        </div>

        <div className="flex min-h-[44rem] min-w-0 flex-col overflow-hidden bg-background sm:rounded-b-2xl">
      {topLevelError ? (
        <div className="shrink-0 border-b bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {topLevelError}
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1">
        {/* ── Left sidebar: ticket list (md+) ── */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border/70 md:flex xl:w-80">
          {/* Sidebar header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <p className="text-sm font-semibold">
              Queue
              {tickets.length > 0 ? (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {tickets.length}
                </span>
              ) : null}
            </p>
          </div>

          {/* Ticket list */}
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {tickets.map((ticket) => renderTicketRow(ticket))}
            {tickets.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No tickets match the filters.
              </div>
            ) : null}
          </div>
        </aside>

        {/* ── Right: conversation ── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Conversation top bar */}
          <div className="sticky top-0 z-10 flex min-w-0 shrink-0 items-center gap-2 border-b border-border/70 bg-background/95 px-3 py-3 backdrop-blur supports-backdrop-filter:bg-background/80">
            {/* Mobile: slide-over Sheet trigger */}
            <Sheet open={mobileQueueOpen} onOpenChange={setMobileQueueOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-xl md:hidden"
                  aria-label="Open ticket list"
                >
                  <ListFilter className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-screen max-w-none flex-col gap-0 p-0 sm:w-[88vw] sm:max-w-sm"
              >
                <SheetTitle className="sr-only">Support tickets</SheetTitle>
                {/* Sheet header */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
                  <p className="text-sm font-semibold">
                    {title}
                    {tickets.length > 0 ? (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {tickets.length}
                      </span>
                    ) : null}
                  </p>
                  {canCreate ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-xl"
                      onClick={() => {
                        setMobileQueueOpen(false);
                        setCreateOpen(true);
                      }}
                      aria-label="New ticket"
                    >
                      <MessageSquarePlus className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
                {/* Sheet search */}
                <div className="shrink-0 space-y-2 border-b px-3 py-3">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tickets…"
                    className="h-8 text-xs"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-7 text-xs">
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
                </div>
                {/* Sheet ticket list */}
                <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
                  {tickets.map((ticket) =>
                    renderTicketRow(ticket, () => setMobileQueueOpen(false)),
                  )}
                  {tickets.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No tickets found.
                    </div>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>

            {/* Active ticket info */}
            <div className="min-w-0 flex-1 overflow-hidden">
              {selectedConversation ? (
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {selectedConversation.ticket.subject}
                  </p>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {selectedConversation.ticket.status.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {selectedConversation.ticket.ticket_number}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm font-semibold text-foreground">{title}</p>
              )}
            </div>

            {/* Admin manage controls in top bar */}
            {selectedConversation && canModerateQueue ? (
              <div className="hidden shrink-0 items-center gap-2 md:flex">
                <Select
                  value={manageStatus}
                  onValueChange={(value) =>
                    setManageDraft({
                      ticketId: effectiveSelectedTicketId!,
                      status: value as SupportTicketStatus,
                      priority: managePriority,
                      assignedAdminId: manageAssignedAdminId,
                    })
                  }
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
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
                      ticketId: effectiveSelectedTicketId!,
                      status: manageStatus,
                      priority: value as SupportTicketPriority,
                      assignedAdminId: manageAssignedAdminId,
                    })
                  }
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => void handleUpdateTicket()}
                  disabled={
                    Boolean(ticketAction) ||
                    tenantAdminQuery.isLoading ||
                    globalAdminQuery.isLoading
                  }
                >
                  {ticketAction === "save" ? (
                    <LoadingButtonContent label="Saving…" />
                  ) : (
                    "Save"
                  )}
                </Button>
                {canReviewPhotoReset ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => void handlePhotoResetDecision("accepted")}
                      disabled={Boolean(ticketAction)}
                    >
                      {ticketAction === "approve" ? (
                        <LoadingButtonContent label="Approving…" />
                      ) : (
                        <>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => void handlePhotoResetDecision("declined")}
                      disabled={Boolean(ticketAction)}
                    >
                      {ticketAction === "decline" ? (
                        <LoadingButtonContent label="Declining…" />
                      ) : (
                        <>
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Decline
                        </>
                      )}
                    </Button>
                  </>
                ) : isPhotoResetTicket && photoResetDecisionStatus !== "approved" && photoResetDecisionStatus !== "declined" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => void handleResetPhotoCooldown()}
                    disabled={Boolean(ticketAction)}
                  >
                    {ticketAction === "save" ? (
                      <LoadingButtonContent label="Unlocking…" />
                    ) : (
                      "Unlock photo"
                    )}
                  </Button>
                ) : isPhotoResetTicket ? (
                  <Badge
                    variant={
                      photoResetDecisionStatus === "approved"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px]"
                  >
                    {photoResetDecisionStatus === "approved"
                      ? "Approved"
                      : photoResetDecisionStatus === "declined"
                        ? "Declined"
                        : "Pending review"}
                  </Badge>
                ) : null}
              </div>
            ) : selectedConversation &&
              !canManage &&
              selectedConversation.ticket.status !== "closed" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 text-xs"
                onClick={() => void handleUpdateTicket("closed")}
                disabled={Boolean(ticketAction)}
              >
                {ticketAction === "close" ? (
                  <LoadingButtonContent label="Closing…" />
                ) : (
                  "Close"
                )}
              </Button>
            ) : null}

            {/* Mobile new-ticket button */}
            {canCreate ? (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 rounded-xl md:hidden"
                onClick={() => setCreateOpen(true)}
                aria-label="New ticket"
              >
                <MessageSquarePlus className="size-4" />
              </Button>
            ) : null}
          </div>

          {/* Admin manage controls on mobile (below bar) */}
          {selectedConversation && canModerateQueue ? (
            <div className="grid shrink-0 grid-cols-2 gap-2 border-b bg-muted/20 px-3 py-2 md:hidden">
              <Select
                value={manageStatus}
                onValueChange={(value) =>
                  setManageDraft({
                    ticketId: effectiveSelectedTicketId!,
                    status: value as SupportTicketStatus,
                    priority: managePriority,
                    assignedAdminId: manageAssignedAdminId,
                  })
                }
              >
                <SelectTrigger className="h-9 w-full text-xs">
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
                    ticketId: effectiveSelectedTicketId!,
                    status: manageStatus,
                    priority: value as SupportTicketPriority,
                    assignedAdminId: manageAssignedAdminId,
                  })
                }
              >
                <SelectTrigger className="h-9 w-full text-xs">
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
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => void handleUpdateTicket()}
                disabled={Boolean(ticketAction)}
              >
                {ticketAction === "save" ? (
                  <LoadingButtonContent label="Saving…" />
                ) : (
                  "Save"
                )}
              </Button>
              {canReviewPhotoReset ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => void handlePhotoResetDecision("accepted")}
                    disabled={Boolean(ticketAction)}
                  >
                    {ticketAction === "approve" ? (
                      <LoadingButtonContent label="Approving…" />
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => void handlePhotoResetDecision("declined")}
                    disabled={Boolean(ticketAction)}
                  >
                    {ticketAction === "decline" ? (
                      <LoadingButtonContent label="Declining…" />
                    ) : (
                      <>
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Decline
                      </>
                    )}
                  </Button>
                </>
              ) : isPhotoResetTicket && photoResetDecisionStatus !== "approved" && photoResetDecisionStatus !== "declined" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => void handleResetPhotoCooldown()}
                  disabled={Boolean(ticketAction)}
                >
                  {ticketAction === "save" ? (
                    <LoadingButtonContent label="Unlocking…" />
                  ) : (
                    "Unlock photo"
                  )}
                </Button>
              ) : isPhotoResetTicket ? (
                <div className="col-span-2">
                  <Badge
                    variant={
                      photoResetDecisionStatus === "approved"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px]"
                  >
                    {photoResetDecisionStatus === "approved"
                      ? "Approved"
                      : photoResetDecisionStatus === "declined"
                        ? "Declined"
                        : "Pending review"}
                  </Badge>
                </div>
              ) : null}
            </div>
          ) : null}

          {selectedConversation && isAuditOnlyView ? (
            <div className="shrink-0 border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Platform oversight view. Tenant message content is hidden. You can review ticket activity, status, tenant, requester, and timestamps only.
            </div>
          ) : null}

          {/* Messages area */}
          <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-muted/[0.14] px-3 py-3 pb-28 md:bg-transparent md:px-4 md:pb-4">
            {!effectiveSelectedTicketId ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <LifeBuoy className="size-10 text-muted-foreground/40" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    No ticket selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tickets.length > 0
                      ? "Choose a ticket from the list to view the thread."
                      : "Open a new ticket to get started."}
                  </p>
                </div>
                {canCreate ? (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <MessageSquarePlus className="mr-2 size-4" />
                    New ticket
                  </Button>
                ) : null}
              </div>
            ) : conversationQuery.isLoading ? (
              <ChangingLoadingState
                messages={["Loading conversation…", "Pulling message history…"]}
              />
            ) : selectedConversation ? (
              selectedConversation.messages.map((message) => {
                const isOwn =
                  (scope === "student" && message.author_type === "student") ||
                  (scope === "admin" && message.author_type === "admin");

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full min-w-0",
                      isOwn ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[92%] min-w-0 overflow-hidden px-3.5 py-3 text-sm shadow-sm md:max-w-[78%]",
                        isOwn
                          ? "rounded-[22px] rounded-br-md bg-foreground text-background"
                          : "rounded-[22px] rounded-bl-md border bg-card text-foreground",
                      )}
                    >
                      <p className="truncate text-[11px] font-semibold opacity-70">
                        {message.author.name}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {message.body}
                      </p>
                      {message.is_redacted ? (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Logged in platform oversight view
                        </p>
                      ) : null}
                      <p
                        className={cn(
                          "mt-1.5 text-[11px]",
                          isOwn ? "opacity-60" : "text-muted-foreground",
                        )}
                      >
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-xs text-muted-foreground">
                {(conversationQuery.error as Error | undefined)?.message ||
                  "Support conversation is unavailable right now."}
              </div>
            )}
          </div>

          {/* Reply bar */}
          {effectiveSelectedTicketId && !isAuditOnlyView ? (
            <div className="sticky bottom-0 flex min-w-0 shrink-0 items-end gap-2 border-t bg-background/95 px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur supports-backdrop-filter:bg-background/80">
              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    void handleSendMessage();
                  }
                }}
                placeholder="Write a message…"
                rows={1}
                className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-[22px] border bg-background text-sm"
              />
              <Button
                size="icon"
                className="size-11 shrink-0 rounded-[22px]"
                onClick={() => void handleSendMessage()}
                disabled={createMessage.isPending || !replyBody.trim()}
                aria-label="Send message"
              >
                {createMessage.isPending ? (
                  <LoadingButtonContent label="" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          ) : effectiveSelectedTicketId && isAuditOnlyView ? (
            <div className="sticky bottom-0 shrink-0 border-t bg-background/95 px-3 py-3 text-xs text-muted-foreground backdrop-blur supports-backdrop-filter:bg-background/80">
              Super admin can monitor tenant support logs here, but cannot reply to or moderate tenant support tickets.
            </div>
          ) : null}
        </div>
      </div>

      </div>
      </div>

      {/* Create ticket dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
                rows={6}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createTicket.isPending}>
                {createTicket.isPending ? (
                  <LoadingButtonContent label="Creating ticket…" />
                ) : (
                  "Create ticket"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
