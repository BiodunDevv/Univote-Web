export type NotificationPriority = "low" | "medium" | "high";

export interface AppNotification {
  id: string;
  tenant_id?: string | null;
  recipient_type: "student" | "admin" | "super_admin";
  type: string;
  title: string;
  message: string;
  link?: string | null;
  priority: NotificationPriority;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  summary: {
    total: number;
    unread: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
