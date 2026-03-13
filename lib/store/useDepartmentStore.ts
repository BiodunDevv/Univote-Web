import { create } from "zustand";
import { getStoredToken, useAuthStore } from "./useAuthStore";

interface DepartmentRow {
  _id: string;
  name: string;
  code: string;
  description: string;
  hod_name: string;
  hod_email: string;
  available_levels: string[];
  is_active: boolean;
  student_count: number;
  college: {
    id: string;
    name: string;
    code: string;
  };
}

interface DepartmentOverview {
  totals: {
    total_departments: number;
    active_departments: number;
    inactive_departments: number;
    total_students: number;
  };
  colleges: Array<{
    id: string;
    name: string;
    code: string;
    department_count: number;
    student_count: number;
  }>;
}

interface DepartmentState {
  departments: DepartmentRow[];
  overview: DepartmentOverview | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  fetchDepartments: (
    token?: string,
    params?: {
      search?: string;
      college_id?: string;
      is_active?: boolean;
      page?: number;
      limit?: number;
    },
  ) => Promise<void>;
  fetchOverview: (token?: string) => Promise<void>;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const handleAuthExpiry = () => {
  if (typeof window === "undefined") return;
  useAuthStore.getState().logout();
  const ref = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/auth/signin?ref=${encodeURIComponent(ref)}`;
};

const parseError = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json();
    return payload.error || fallback;
  } catch {
    return fallback;
  }
};

export const useDepartmentStore = create<DepartmentState>((set) => ({
  departments: [],
  overview: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  },

  fetchDepartments: async (
    token?: string,
    params?: {
      search?: string;
      college_id?: string;
      is_active?: boolean;
      page?: number;
      limit?: number;
    },
  ) => {
    const authToken = token || getStoredToken();
    if (!authToken) return;

    set({ loading: true, error: null });

    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.college_id)
        queryParams.append("college_id", params.college_id);
      if (params?.is_active !== undefined) {
        queryParams.append("is_active", String(params.is_active));
      }
      if (params?.page) queryParams.append("page", String(params.page));
      if (params?.limit) queryParams.append("limit", String(params.limit));

      const response = await fetch(
        `${API_URL}/api/admin/departments?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 401) {
        handleAuthExpiry();
        throw new Error("Session expired");
      }

      if (!response.ok) {
        throw new Error(
          await parseError(response, "Failed to fetch departments"),
        );
      }

      const data = await response.json();
      set({
        departments: data.departments || [],
        pagination: {
          page: data.page || 1,
          pages: data.pages || 1,
          total: data.total || 0,
          limit: data.limit || params?.limit || 20,
        },
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch departments",
      });
    }
  },

  fetchOverview: async (token?: string) => {
    const authToken = token || getStoredToken();
    if (!authToken) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch(
        `${API_URL}/api/admin/departments/overview`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 401) {
        handleAuthExpiry();
        throw new Error("Session expired");
      }

      if (!response.ok) {
        throw new Error(
          await parseError(response, "Failed to fetch department overview"),
        );
      }

      const data = await response.json();
      set({ overview: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch department overview",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
