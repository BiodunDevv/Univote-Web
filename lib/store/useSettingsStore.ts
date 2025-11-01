import { create } from "zustand";

// Types
export interface AdminProfile {
  _id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin";
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  students: {
    total: number;
    active: number;
    inactive: number;
    with_facial_data: number;
    facial_registration_rate: string;
  };
  colleges: {
    total: number;
    total_departments: number;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
  votes: {
    total: number;
  };
  admins: {
    total: number;
  };
  recent_sessions: Array<{
    _id: string;
    title: string;
    status: string;
    start_time: string;
    end_time: string;
    vote_count: number;
  }>;
  recent_audit_logs: Array<{
    action: string;
    details: string;
    admin: {
      name: string;
      email: string;
    } | null;
    timestamp: string;
    ip_address: string;
  }>;
}

export interface SystemConfig {
  facepp: {
    configured: boolean;
    base_url: string;
    has_api_key: boolean;
    has_api_secret: boolean;
  };
  email: {
    configured: boolean;
    smtp_host: string;
    smtp_port: string;
    from_email: string;
  };
  database: {
    connected: boolean;
    database_url: string;
  };
  jwt: {
    configured: boolean;
    student_token_expiry: string;
    admin_token_expiry: string;
  };
  other: {
    bcrypt_rounds: number;
    default_student_password: string;
    environment: string;
    port: number;
  };
}

export interface DatabaseStats {
  students: {
    total: number;
    with_face_token: number;
    with_photo: number;
    active: number;
  };
  votes: {
    by_status: Array<{ _id: string; count: number }>;
    total: number;
  };
  sessions: {
    by_status: Array<{ _id: string; count: number }>;
    total: number;
  };
  admins: {
    by_role: Array<{ _id: string; count: number }>;
    total: number;
  };
  colleges: number;
  audit_logs: number;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  checks: {
    database: {
      status: string;
      message: string;
    };
    facepp: {
      status: string;
      message: string;
      base_url: string;
    };
    email: {
      status: string;
      message: string;
    };
    jwt: {
      status: string;
      message: string;
    };
  };
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  timestamp: string;
  ip_address: string;
  user_agent: string;
}

export interface NotificationPreferences {
  email_on_new_vote?: boolean;
  email_on_session_end?: boolean;
  email_on_student_upload?: boolean;
  email_on_system_alert?: boolean;
}

interface SettingsStore {
  profile: AdminProfile | null;
  dashboardStats: DashboardStats | null;
  systemConfig: SystemConfig | null;
  databaseStats: DatabaseStats | null;
  systemHealth: SystemHealth | null;
  auditLogs: AuditLog[];
  auditActions: string[];
  notificationPreferences: NotificationPreferences | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
  loading: boolean;
  error: string | null;

  // Actions
  getProfile: (token: string) => Promise<AdminProfile>;
  updateProfile: (
    token: string,
    data: { full_name?: string; email?: string }
  ) => Promise<AdminProfile>;
  changePassword: (
    token: string,
    data: { current_password: string; new_password: string }
  ) => Promise<void>;
  getDashboardStats: (token: string) => Promise<DashboardStats>;
  getSystemConfig: (token: string) => Promise<SystemConfig>;
  getDatabaseStats: (token: string) => Promise<DatabaseStats>;
  getSystemHealth: (token: string) => Promise<SystemHealth>;
  getAuditLogs: (
    token: string,
    params?: {
      action?: string;
      admin_id?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    }
  ) => Promise<AuditLog[]>;
  getAuditActions: (token: string) => Promise<string[]>;
  cleanupAuditLogs: (token: string, days_old: number) => Promise<number>;
  testEmail: (token: string, recipient_email: string) => Promise<void>;
  testFacepp: (token: string, image_url: string) => Promise<unknown>;
  exportData: (
    token: string,
    data_type: string,
    format?: string,
    filters?: Record<string, unknown>
  ) => Promise<Blob>;
  getNotificationPreferences: (
    token: string
  ) => Promise<NotificationPreferences>;
  updateNotificationPreferences: (
    token: string,
    preferences: NotificationPreferences
  ) => Promise<NotificationPreferences>;
  clearError: () => void;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "An error occurred";
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  profile: null,
  dashboardStats: null,
  systemConfig: null,
  databaseStats: null,
  systemHealth: null,
  auditLogs: [],
  auditActions: [],
  notificationPreferences: null,
  pagination: null,
  loading: false,
  error: null,

  getProfile: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get profile");
      }

      const data = await response.json();
      set({ profile: data.profile, loading: false });
      return data.profile;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  updateProfile: async (
    token: string,
    updateData: { full_name?: string; email?: string }
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const data = await response.json();
      set({ profile: data.profile, loading: false });
      return data.profile;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  changePassword: async (
    token: string,
    passwordData: { current_password: string; new_password: string }
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(passwordData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      set({ loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  getDashboardStats: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get dashboard stats");
      }

      const data = await response.json();
      set({ dashboardStats: data.dashboard, loading: false });
      return data.dashboard;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  getSystemConfig: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/system`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get system config");
      }

      const data = await response.json();
      set({ systemConfig: data.system_config, loading: false });
      return data.system_config;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  getDatabaseStats: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/database-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get database stats");
      }

      const data = await response.json();
      set({ databaseStats: data.database_statistics, loading: false });
      return data.database_statistics;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  getSystemHealth: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/health`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get system health");
      }

      const data = await response.json();
      set({ systemHealth: data.health, loading: false });
      return data.health;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  getAuditLogs: async (token: string, params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/audit-logs${
          queryParams ? `?${queryParams}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get audit logs");
      }

      const data = await response.json();
      set({
        auditLogs: data.audit_logs,
        pagination: data.pagination,
        loading: false,
      });
      return data.audit_logs;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  getAuditActions: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/audit-actions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get audit actions");
      }

      const data = await response.json();
      set({ auditActions: data.actions, loading: false });
      return data.actions;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  cleanupAuditLogs: async (token: string, days_old: number) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/audit-logs/cleanup`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ days_old }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cleanup audit logs");
      }

      const data = await response.json();
      set({ loading: false });
      return data.deleted_count;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  testEmail: async (token: string, recipient_email: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/test-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ recipient_email }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send test email");
      }

      set({ loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  testFacepp: async (token: string, image_url: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/test-facepp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image_url }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to test Face++");
      }

      const data = await response.json();
      set({ loading: false });
      return data;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  exportData: async (
    token: string,
    data_type: string,
    format = "json",
    filters = {}
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ data_type, format, filters }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export data");
      }

      const blob = await response.blob();
      set({ loading: false });
      return blob;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  getNotificationPreferences: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to get notification preferences"
        );
      }

      const data = await response.json();
      set({
        notificationPreferences: data.notification_preferences,
        loading: false,
      });
      return data.notification_preferences;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  updateNotificationPreferences: async (
    token: string,
    preferences: NotificationPreferences
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/settings/notifications`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to update notification preferences"
        );
      }

      const data = await response.json();
      set({
        notificationPreferences: data.notification_preferences,
        loading: false,
      });
      return data.notification_preferences;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
