import { create } from "zustand";
import api from "@/lib/api";
import {
  Admin,
  AdminStats,
  CreateAdminDto,
  UpdateAdminDto,
  AdminListResponse,
} from "@/types/admin";

interface AdminState {
  admins: Admin[];
  currentAdmin: Admin | null;
  stats: AdminStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Actions
  fetchAdmins: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    is_active?: boolean;
  }) => Promise<void>;
  fetchAdminById: (id: string) => Promise<void>;
  createAdmin: (data: CreateAdminDto) => Promise<void>;
  updateAdmin: (id: string, data: UpdateAdminDto) => Promise<void>;
  deleteAdmin: (id: string, permanent?: boolean) => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  admins: [],
  currentAdmin: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  fetchAdmins: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<AdminListResponse>("/api/admin/admins", {
        params,
      });
      set({
        admins: response.data.admins,
        pagination: response.data.pagination,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch admins",
      });
      throw error;
    }
  },

  fetchAdminById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ admin: Admin }>(
        `/api/admin/admins/${id}`
      );
      set({
        currentAdmin: response.data.admin,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch admin",
      });
      throw error;
    }
  },

  createAdmin: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/api/admin/create-admin", data);
      set({ isLoading: false });
      // Refresh admin list
      get().fetchAdmins();
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to create admin",
      });
      throw error;
    }
  },

  updateAdmin: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/api/admin/admins/${id}`, data);
      set({ isLoading: false });
      // Refresh admin list
      get().fetchAdmins();
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to update admin",
      });
      throw error;
    }
  },

  deleteAdmin: async (id, permanent = false) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/admin/admins/${id}`, {
        params: { permanent },
      });
      set({ isLoading: false });
      // Refresh admin list
      get().fetchAdmins();
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to delete admin",
      });
      throw error;
    }
  },

  fetchAdminStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<AdminStats>("/api/admin/admin-stats");
      set({
        stats: response.data,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch admin stats",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
