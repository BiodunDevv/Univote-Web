import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    resetCode: string,
    newPassword: string
  ) => Promise<void>;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
export const getStoredAdmin = (): Admin | null => {
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
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/api/auth/admin-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Login failed");
          }

          set({
            token: data.token,
            admin: data.admin,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed",
          });
          throw error;
        }
      },
      logout: () => {
        set({
          token: null,
          admin: null,
          error: null,
        });
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(
            `${API_URL}/api/auth/admin-forgot-password`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to send reset code");
          }

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
        newPassword: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(
            `${API_URL}/api/auth/admin-reset-password`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                reset_code: resetCode,
                new_password: newPassword,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to reset password");
          }

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
      }),
    }
  )
);
