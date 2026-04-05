export type SupportScope = "student" | "admin";

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";
export type SupportTicketCategory =
  | "general"
  | "account"
  | "voting"
  | "technical";

export interface SupportActorSnapshot {
  id?: string;
  name: string;
  email?: string | null;
  matric_no?: string | null;
  role?: string | null;
}

export interface SupportTenantSummary {
  id: string;
  name: string;
  slug: string;
}

export interface SupportTicket {
  id: string;
  tenant_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  photo_reset_decision_status?: "pending" | "approved" | "declined" | null;
  photo_reset_decided_at?: string | null;
  requester_type: "student" | "admin";
  requester: SupportActorSnapshot;
  assigned_admin: (SupportActorSnapshot & { id: string }) | null;
  unread_by_requester_count: number;
  unread_by_admin_count: number;
  last_message_at: string;
  last_message_preview?: string | null;
  tenant?: SupportTenantSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  author_type: "student" | "admin";
  author: SupportActorSnapshot;
  body: string;
  attachments: string[];
  is_redacted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportOverviewResponse {
  overview: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    unassigned: number;
    unread_total: number;
  };
  permissions: {
    can_manage: boolean;
    can_create: boolean;
    can_reply: boolean;
  };
}

export interface SupportTypingEvent {
  ticket_id: string;
  actor: {
    id: string | null;
    type: "student" | "admin" | null;
    role?: string | null;
    name: string;
  };
  timestamp: string;
}

export interface SupportTicketListResponse {
  tickets: SupportTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SupportConversationResponse {
  ticket: SupportTicket;
  messages: SupportMessage[];
}
