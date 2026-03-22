import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiRequest, isApiError } from "@/lib/api/client";
import {
  clearSharedAdminContext,
  writeSharedAdminContext,
} from "@/lib/shared-admin-context";
import { normalizeTenantSlug, setTenantSlugOverride } from "@/lib/tenant";
import type {
  TenantContext,
  TenantMembership,
  TenantOrganization,
} from "@/types/tenant";

export interface AuthAdmin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_role?: string | null;
  permissions?: string[];
}

export interface AuthSessionData {
  token: string;
  admin: AuthAdmin;
  tenant?: TenantContext | null;
  organizations?: TenantOrganization[];
  membership?: TenantMembership | null;
}

function syncSharedAdminContext(session: AuthSessionData | null) {
  if (!session || session.admin.role === "super_admin") {
    clearSharedAdminContext();
    return;
  }

  writeSharedAdminContext({
    admin: {
      full_name: session.admin.full_name,
      role: session.admin.role,
    },
    tenant: session.tenant || null,
    organizations: session.organizations || [],
    updated_at: new Date().toISOString(),
  });
}

function clearPersistedAdminAuthState() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem("auth-storage");
  } catch {
    return;
  }
}

interface AuthState {
  token: string | null;
  admin: AuthAdmin | null;
  tenant: TenantContext | null;
  organizations: TenantOrganization[];
  membership: TenantMembership | null;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setHasHydrated: (hasHydrated: boolean) => void;
  setSession: (session: AuthSessionData) => void;
  login: (
    email: string,
    password: string,
    tenantSlug?: string | null,
  ) => Promise<AuthSessionData>;
  switchOrganization: (
    tenantSlug: string,
    persistSession?: boolean,
  ) => Promise<AuthSessionData>;
  linkOrganization: (
    tenantSlug: string,
    email: string,
    password: string,
    label?: string,
  ) => Promise<TenantOrganization[]>;
  unlinkOrganization: (tenantSlug: string) => Promise<TenantOrganization[]>;
  logout: () => void;
  updateAdmin: (updatedAdmin: Partial<AuthAdmin>) => void;
  updateTenant: (updatedTenant: Partial<TenantContext>) => void;
  forgotPassword: (email: string, tenantSlug?: string | null) => Promise<void>;
  resetPassword: (
    email: string,
    resetCode: string,
    newPassword: string,
    tenantSlug?: string | null,
  ) => Promise<void>;
  clearError: () => void;
}

// Helper function to get token from localStorage immediately
export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
};

// Helper function to get admin from localStorage immediately
export const getStoredAdmin = (): AuthAdmin | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.admin || null;
    }
  } catch {
    return null;
  }
  return null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      tenant: null,
      organizations: [],
      membership: null,
      hasHydrated: false,
      isLoading: false,
      error: null,

      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),

      setSession: (session) => {
        set((state) => ({
          token: session.token,
          admin: session.admin,
          tenant: session.tenant || null,
          organizations: session.organizations || [],
          membership: session.membership || null,
          isLoading: false,
          error: null,
          hasHydrated: state.hasHydrated,
        }));
        setTenantSlugOverride(
          session.admin.role === "super_admin"
            ? null
            : (session.tenant?.slug ?? null),
        );
        syncSharedAdminContext(session);
      },

      login: async (
        email: string,
        password: string,
        tenantSlug?: string | null,
      ) => {
        set({ isLoading: true, error: null });
        try {
          const requestedTenantSlug = normalizeTenantSlug(tenantSlug);
          const data = await apiRequest<AuthSessionData>(
            "/api/auth/admin-login",
            {
              method: "POST",
              data: { email, password },
              headers: requestedTenantSlug
                ? { "X-Tenant-Slug": requestedTenantSlug }
                : undefined,
              auth: "optional",
              redirectOnAuthError: false,
            },
          );

          set((state) => ({
            token: data.token,
            admin: data.admin,
            tenant: data.tenant || null,
            organizations: data.organizations || [],
            membership: data.membership || null,
            isLoading: false,
            error: null,
            hasHydrated: state.hasHydrated,
          }));
          setTenantSlugOverride(
            data.admin.role === "super_admin"
              ? null
              : data.tenant?.slug || requestedTenantSlug || null,
          );
          syncSharedAdminContext(data);
          return data;
        } catch (error: unknown) {
          set({
            isLoading: false,
            error:
              isApiError(error) && error.code === "TENANT_REQUIRED"
                ? "Enter your organisation slug to sign in as a tenant admin."
                : error instanceof Error
                  ? error.message
                  : "Login failed",
          });
          throw error;
        }
      },
      switchOrganization: async (tenantSlug: string, persistSession = true) => {
        void tenantSlug;
        void persistSession;
        const error = new Error(
          "Organisation switching has been removed. Sign in directly to the university workspace you need.",
        );
        set({ isLoading: false, error: error.message });
        throw error;
      },
      linkOrganization: async (
        tenantSlug: string,
        email: string,
        password: string,
        label?: string,
      ) => {
        void tenantSlug;
        void email;
        void password;
        void label;
        const error = new Error(
          "Linked organisations have been removed from this build.",
        );
        set({ isLoading: false, error: error.message });
        throw error;
      },
      unlinkOrganization: async (tenantSlug: string) => {
        void tenantSlug;
        const error = new Error(
          "Linked organisations have been removed from this build.",
        );
        set({ isLoading: false, error: error.message });
        throw error;
      },
      logout: () => {
        setTenantSlugOverride(null);
        clearSharedAdminContext();
        clearPersistedAdminAuthState();
        set({
          token: null,
          admin: null,
          tenant: null,
          organizations: [],
          membership: null,
          error: null,
        });
      },

      updateAdmin: (updatedAdmin: Partial<AuthAdmin>) => {
        set((state) => {
          const nextAdmin = state.admin
            ? { ...state.admin, ...updatedAdmin }
            : null;

          if (state.token && nextAdmin) {
            syncSharedAdminContext({
              token: state.token,
              admin: nextAdmin,
              tenant: state.tenant,
              organizations: state.organizations,
              membership: state.membership,
            });
          }

          return {
            admin: nextAdmin,
          };
        });
      },

      updateTenant: (updatedTenant: Partial<TenantContext>) => {
        set((state) => {
          const nextTenant = state.tenant
            ? { ...state.tenant, ...updatedTenant }
            : null;

          if (state.token && state.admin) {
            syncSharedAdminContext({
              token: state.token,
              admin: state.admin,
              tenant: nextTenant,
              organizations: state.organizations,
              membership: state.membership,
            });
          }

          if (state.admin?.role !== "super_admin") {
            setTenantSlugOverride(nextTenant?.slug ?? null);
          }

          return {
            tenant: nextTenant,
          };
        });
      },

      forgotPassword: async (email: string, tenantSlug?: string | null) => {
        set({ isLoading: true, error: null });
        try {
          const requestedTenantSlug = normalizeTenantSlug(tenantSlug);
          await apiRequest("/api/auth/admin-forgot-password", {
            method: "POST",
            data: { email },
            headers: requestedTenantSlug
              ? { "X-Tenant-Slug": requestedTenantSlug }
              : undefined,
            auth: "optional",
            redirectOnAuthError: false,
          });

          set({ isLoading: false, error: null });
        } catch (error: unknown) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to send reset code",
          });
          throw error;
        }
      },
      resetPassword: async (
        email: string,
        resetCode: string,
        newPassword: string,
        tenantSlug?: string | null,
      ) => {
        set({ isLoading: true, error: null });
        try {
          const requestedTenantSlug = normalizeTenantSlug(tenantSlug);
          await apiRequest("/api/auth/admin-reset-password", {
            method: "POST",
            data: {
              email,
              reset_code: resetCode,
              new_password: newPassword,
            },
            headers: requestedTenantSlug
              ? { "X-Tenant-Slug": requestedTenantSlug }
              : undefined,
            auth: "optional",
            redirectOnAuthError: false,
          });

          set({ isLoading: false, error: null });
        } catch (error: unknown) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to reset password",
          });
          throw error;
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        tenant: state.tenant,
        organizations: state.organizations,
        membership: state.membership,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && state.admin) {
          syncSharedAdminContext({
            token: state.token,
            admin: state.admin,
            tenant: state.tenant,
            organizations: state.organizations,
            membership: state.membership,
          });
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
