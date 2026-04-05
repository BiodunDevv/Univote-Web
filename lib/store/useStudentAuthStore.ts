import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiRequest, ApiError, getStoredStudentToken } from "@/lib/api/client";
import type { StudentPortalUser } from "@/types/student-portal";
import type { TenantContext } from "@/types/tenant";

type StudentLoginResponse = {
  token: string;
  student: StudentPortalUser;
  new_device?: boolean;
  tenant?: TenantContext | null;
};

type StudentProfileResponse = {
  student?: StudentPortalUser;
  profile?: StudentPortalUser;
  tenant?: TenantContext | null;
};

interface StudentAuthState {
  token: string | null;
  firstLoginToken: string | null;
  student: StudentPortalUser | null;
  tenant: TenantContext | null;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  setHasHydrated: (value: boolean) => void;
  login: (
    email: string,
    password: string,
    tenantSlug?: string | null,
  ) => Promise<{ newDevice: boolean; requiresPasswordChange: boolean }>;
  changePassword: (newPassword: string) => Promise<void>;
  fetchProfile: () => Promise<StudentPortalUser>;
  updateProfile: (payload: {
    full_name?: string;
    email?: string;
    photo_url?: string | null;
  }) => Promise<StudentPortalUser>;
  forgotPassword: (email: string, tenantSlug?: string | null) => Promise<void>;
  resetPassword: (
    email: string,
    resetCode: string,
    newPassword: string,
    tenantSlug?: string | null,
  ) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function normalizeStudentProfile(
  payload:
    | (StudentPortalUser & {
        _id?: string;
        display_identifier?: string | null;
      })
    | undefined,
): StudentPortalUser {
  if (!payload) {
    throw new Error("Student profile is unavailable");
  }

  return {
    ...payload,
    id:
      payload.id ||
      payload._id ||
      payload.display_identifier ||
      payload.matric_no ||
      payload.email,
    photo_url: payload.photo_url || null,
    has_facial_data: Boolean(payload.has_facial_data),
  };
}

function clearPersistedParticipantAuthState() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem("student-auth-storage");
  } catch {
    return;
  }
}

export const useStudentAuthStore = create<StudentAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      firstLoginToken: null,
      student: null,
      tenant: null,
      hasHydrated: false,
      isLoading: false,
      error: null,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      login: async (email, password, tenantSlug) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRequest<StudentLoginResponse>(
            "/api/auth/login",
            {
              method: "POST",
              data: {
                email: email.trim(),
                password,
                device_id:
                  typeof navigator !== "undefined"
                    ? navigator.userAgent
                    : "web-client",
              },
              headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
              auth: "optional",
              redirectOnAuthError: false,
            },
          );

          const student = normalizeStudentProfile(response.student);
          set({
            token: response.token,
            student,
            tenant: response.tenant || null,
            firstLoginToken: student.first_login ? response.token : null,
            isLoading: false,
            error: null,
          });

          return {
            newDevice: Boolean(response.new_device),
            requiresPasswordChange: Boolean(student.first_login),
          };
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.code === "FIRST_LOGIN" &&
            typeof error.payload?.token === "string"
          ) {
            set({
              firstLoginToken: error.payload.token,
              isLoading: false,
              error: "Password change required",
            });
            throw new Error("FIRST_LOGIN");
          }

          const message =
            error instanceof Error ? error.message : "Login failed";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      changePassword: async (newPassword) => {
        const firstLoginToken = get().firstLoginToken || get().token;

        if (!firstLoginToken) {
          throw new Error("No first-login token available");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await apiRequest<{
            token: string;
            student: StudentPortalUser;
            tenant?: TenantContext | null;
          }>("/api/auth/change-password", {
            method: "PATCH",
            body: JSON.stringify({ new_password: newPassword }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${firstLoginToken}`,
            },
            auth: "optional",
            redirectOnAuthError: false,
          });

          set({
            token: response.token,
            student: normalizeStudentProfile(response.student),
            tenant: response.tenant || null,
            firstLoginToken: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to change password";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      fetchProfile: async () => {
        const token = get().token || getStoredStudentToken();
        if (!token) {
          throw new Error("No student session found");
        }

        const response = await apiRequest<StudentProfileResponse>(
          "/api/auth/me",
          {
            auth: "student",
          },
        );
        const student = normalizeStudentProfile(
          response.profile || response.student,
        );
        set({ token, student, tenant: response.tenant || null, error: null });
        return student;
      },

      updateProfile: async (payload) => {
        const response = await apiRequest<{
          profile: StudentPortalUser;
          tenant?: TenantContext | null;
        }>("/api/auth/me", {
          method: "PATCH",
          auth: "student",
          data: payload,
        });

        const student = normalizeStudentProfile(response.profile);
        set({ student, tenant: response.tenant || null, error: null });
        return student;
      },

      forgotPassword: async (email, tenantSlug) => {
        set({ isLoading: true, error: null });

        try {
          await apiRequest("/api/auth/forgot-password", {
            method: "POST",
            auth: "optional",
            data: { email },
            headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
            redirectOnAuthError: false,
          });
          set({ isLoading: false, error: null });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to send reset code";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      resetPassword: async (email, resetCode, newPassword, tenantSlug) => {
        set({ isLoading: true, error: null });

        try {
          await apiRequest("/api/auth/reset-password", {
            method: "POST",
            auth: "optional",
            data: {
              email,
              reset_code: resetCode,
              new_password: newPassword,
            },
            headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
            redirectOnAuthError: false,
          });
          set({
            token: null,
            firstLoginToken: null,
            student: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to reset password";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      updatePassword: async (oldPassword, newPassword) => {
        set({ isLoading: true, error: null });

        try {
          await apiRequest("/api/auth/update-password", {
            method: "PATCH",
            auth: "student",
            data: {
              old_password: oldPassword,
              new_password: newPassword,
            },
          });
          set({ isLoading: false, error: null });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to update password";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      logout: async () => {
        try {
          if (get().token) {
            await apiRequest("/api/auth/logout", {
              method: "POST",
              auth: "student",
              redirectOnAuthError: false,
            });
          }
        } catch {
          // Local session clear still takes priority.
        } finally {
          clearPersistedParticipantAuthState();
          set({
            token: null,
            firstLoginToken: null,
            student: null,
            tenant: null,
            error: null,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "student-auth-storage",
      partialize: (state) => ({
        token: state.token,
        firstLoginToken: state.firstLoginToken,
        student: state.student,
        tenant: state.tenant,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
