"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { TenantContext } from "@/types/tenant";
import type { DatabaseStats, SystemHealth } from "@/lib/store/useSettingsStore";
import type { LandingTestimonial } from "@/types/landing";
import type {
  AdminBiometricMetricsResponse,
  AdminVerificationLogEntry,
} from "@/lib/queries/admin";

export type PlatformOverviewResponse = {
  overview: {
    total_tenants: number;
    active_tenants: number;
    suspended_tenants: number;
    grace_period_tenants: number;
    active_tenant_admins: number;
  };
};

export type PlatformTenantListResponse = {
  tenants: Array<
    TenantContext & {
      application_reference?: string | null;
      primary_domain?: string | null;
      is_active: boolean;
      onboarding?: {
        contact_name?: string | null;
        contact_email?: string | null;
        contact_phone?: string | null;
        institution_type?: string | null;
        student_count_estimate?: number | null;
        admin_count_estimate?: number | null;
        notes?: string | null;
        demo_requested?: boolean;
        rejection_reason?: string | null;
        application_submitted_at?: string | null;
        activated_at?: string | null;
        approved_at?: string | null;
        rejected_at?: string | null;
        status_timeline?: Array<{
          status: string;
          label: string;
          note?: string | null;
          at: string;
        }>;
      };
      createdAt: string;
      updatedAt: string;
    }
  >;
  page: number;
  pages: number;
  total: number;
};

export type PlatformTenantDetailResponse = {
  tenant: TenantContext & {
    application_reference?: string | null;
    primary_domain?: string | null;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    onboarding?: {
      contact_name?: string | null;
      contact_email?: string | null;
      institution_type?: string | null;
      student_count_estimate?: number | null;
      admin_count_estimate?: number | null;
      notes?: string | null;
      demo_requested?: boolean;
      rejection_reason?: string | null;
      activated_at?: string | null;
      approved_at?: string | null;
      application_submitted_at?: string | null;
      rejected_at?: string | null;
      status_timeline?: Array<{
        status: string;
        label: string;
        note?: string | null;
        at: string;
      }>;
    };
  };
  stats: {
    admins: {
      total: number;
      active: number;
      owners: number;
    };
    students: {
      total: number;
      active: number;
    };
    colleges: number;
    sessions: {
      total: number;
      active: number;
      upcoming: number;
      ended: number;
    };
    candidates: number;
    votes: {
      total: number;
      accepted: number;
      rejected: number;
    };
  };
  team: Array<{
    id: string;
    admin_id: string;
    full_name: string;
    email: string;
    global_role: string;
    is_global_active: boolean;
    role: string;
    is_active: boolean;
    permissions: string[];
    last_access_at?: string | null;
  }>;
};

export type PlatformAuditLogsResponse = {
  audit_logs: Array<{
    id: string;
    action: string;
    details: Record<string, unknown>;
    admin: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
    tenant: {
      id: string;
      name: string;
      slug: string;
    } | null;
    timestamp: string;
    ip_address?: string | null;
    user_agent?: string | null;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type PlatformAuditActionsResponse = {
  actions: string[];
  total: number;
};

export type PlatformTestimonialsResponse = {
  testimonials: LandingTestimonial[];
  page: number;
  pages: number;
  total: number;
};

export type PlatformBiometricsResponse = {
  message?: string;
  defaults: Record<string, unknown>;
  identity_catalog: Record<string, unknown>;
  biometrics: {
    active_provider: "aws_rekognition";
    provider_catalog: Record<
      string,
      {
        label: string;
        implemented: boolean;
        rollout_visible?: boolean;
        description?: string;
        requirements?: string[];
      }
    >;
    providers: {
      aws_rekognition: {
        enabled: boolean;
        implemented: boolean;
        configured: boolean;
        access_key_id_value?: string | null;
        secret_access_key_value?: string | null;
        access_key_id_masked?: string | null;
        secret_access_key_masked?: string | null;
        region: string;
        similarity_threshold: number;
        collection_prefix?: string;
        liveness_required?: boolean;
        liveness_threshold?: number;
      };
    };
  };
};

export type PlatformVerificationLogsResponse = {
  logs: Array<
    AdminVerificationLogEntry & {
      tenant?: {
        id: string;
        name: string;
        slug: string;
      } | null;
      student?: {
        id: string;
        full_name: string;
        matric_no?: string | null;
        email?: string | null;
      } | null;
      session?: {
        id: string;
        title: string;
        status: string;
      } | null;
    }
  >;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export function usePlatformOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.platform.overview(),
    queryFn: ({ signal }) =>
      apiRequest<PlatformOverviewResponse>("/api/platform/overview", {
        auth: "admin",
        signal,
      }),
  });
}

export function usePlatformBiometricMetricsQuery(
  filters: {
    tenant_id?: string;
    session_id?: string;
    start_date?: string;
    end_date?: string;
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.platform.biometricMetrics(filters),
    queryFn: ({ signal }) =>
      apiRequest<{
        tenant?: { id: string; name: string; slug: string } | null;
        metrics: AdminBiometricMetricsResponse["metrics"];
      }>("/api/platform/biometric-metrics", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function usePlatformVerificationLogsQuery(
  filters: {
    tenant_id?: string;
    session_id?: string;
    result?: string;
    failure_reason?: string;
    decision_source?: string;
    liveness_status?: string;
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.platform.verificationLogs(filters),
    queryFn: ({ signal }) =>
      apiRequest<PlatformVerificationLogsResponse>(
        "/api/platform/verification-logs",
        {
          auth: "admin",
          params: filters,
          signal,
        },
      ),
  });
}

export function usePlatformTenantsQuery(
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.platform.tenants(filters),
    queryFn: ({ signal }) =>
      apiRequest<PlatformTenantListResponse>("/api/platform/tenants", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function usePlatformTenantQuery(tenantId: string, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(tenantId),
    queryKey: queryKeys.platform.tenant(tenantId),
    queryFn: ({ signal }) =>
      apiRequest<PlatformTenantDetailResponse>(
        `/api/platform/tenants/${tenantId}`,
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function usePlatformSettingsQuery() {
  return useQuery({
    queryKey: ["platform", "settings"],
    queryFn: ({ signal }) =>
      apiRequest<PlatformBiometricsResponse>(
        "/api/platform/settings/defaults",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useUpdatePlatformSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<PlatformBiometricsResponse>(
        "/api/platform/settings/defaults",
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["platform", "settings"],
      });
    },
  });
}

export function useCreatePlatformBiometricProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      provider_key: string;
      config?: Record<string, unknown>;
      set_active?: boolean;
    }) =>
      apiRequest<PlatformBiometricsResponse>(
        "/api/platform/settings/biometrics/providers",
        {
          method: "POST",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["platform", "settings"],
      });
    },
  });
}

export function useDeletePlatformBiometricProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerKey: string) =>
      apiRequest<PlatformBiometricsResponse>(
        `/api/platform/settings/biometrics/providers/${providerKey}`,
        {
          method: "DELETE",
          auth: "admin",
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["platform", "settings"],
      });
    },
  });
}

export function useTestPlatformBiometricsMutation() {
  return useMutation({
    mutationFn: ({
      imageUrl,
      providerKey,
    }: {
      imageUrl: string;
      providerKey?: string;
    }) =>
      apiRequest<{
        message: string;
        provider: string;
        provider_status?: Record<string, unknown>;
        summary?: {
          detection: string;
          image_checked: string;
        };
        result: {
          face_token?: string | null;
          face_rectangle?: {
            top: number;
            left: number;
            width: number;
            height: number;
          } | null;
          image_id?: string | null;
        };
        provider_response?: Record<string, unknown>;
      }>("/api/platform/settings/biometrics/test", {
        method: "POST",
        auth: "admin",
        data: { image_url: imageUrl, provider_key: providerKey },
      }),
  });
}

export function usePlatformAuditLogsQuery(
  filters: {
    page?: number;
    limit?: number;
    action?: string;
    admin_id?: string;
    tenant_id?: string;
    start_date?: string;
    end_date?: string;
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.platform.auditLogs(filters),
    queryFn: ({ signal }) =>
      apiRequest<PlatformAuditLogsResponse>("/api/admin/settings/audit-logs", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function usePlatformAuditActionsQuery() {
  return useQuery({
    queryKey: queryKeys.platform.auditActions(),
    queryFn: ({ signal }) =>
      apiRequest<PlatformAuditActionsResponse>(
        "/api/admin/settings/audit-actions",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function usePlatformSystemHealthQuery() {
  return useQuery({
    queryKey: queryKeys.platform.systemHealth(),
    queryFn: ({ signal }) =>
      apiRequest<{ health: SystemHealth }>("/api/admin/settings/health", {
        auth: "admin",
        signal,
      }),
  });
}

export function usePlatformDatabaseStatsQuery() {
  return useQuery({
    queryKey: queryKeys.platform.databaseStats(),
    queryFn: ({ signal }) =>
      apiRequest<{ database_statistics: DatabaseStats }>(
        "/api/admin/settings/database-stats",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function usePlatformTestimonialsQuery(
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.platform.testimonials(filters),
    queryFn: ({ signal }) =>
      apiRequest<PlatformTestimonialsResponse>("/api/platform/testimonials", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useCreatePlatformTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      slug: string;
      primary_domain?: string;
      plan_code?: "university";
      contact_name?: string;
      contact_email?: string;
      owner_admin_id?: string;
    }) =>
      apiRequest<{ tenant: PlatformTenantDetailResponse["tenant"] }>(
        "/api/platform/tenants",
        {
          method: "POST",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.platform.overview(),
        }),
        queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] }),
      ]);
    },
  });
}

export function useUpdatePlatformTenantMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name?: string;
      primary_domain?: string;
      contact_name?: string;
      contact_email?: string;
      support_email?: string;
      institution_type?: string;
      student_count_estimate?: number | null;
      admin_count_estimate?: number | null;
      notes?: string;
      demo_requested?: boolean;
      plan_code?: "university";
      status?: "draft" | "pending_approval" | "active" | "suspended";
      is_active?: boolean;
      rejection_reason?: string;
    }) =>
      apiRequest<{ tenant: PlatformTenantDetailResponse["tenant"] }>(
        `/api/platform/tenants/${tenantId}`,
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.platform.overview(),
        }),
        queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.platform.tenant(tenantId),
        }),
      ]);
    },
  });
}

export function useCleanupPlatformAuditLogsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { days_old: number; preview?: boolean }) =>
      apiRequest<{
        preview?: boolean;
        message: string;
        count?: number;
        deleted_count?: number;
        cutoff_date: string;
      }>("/api/admin/settings/audit-logs/cleanup", {
        method: "DELETE",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async (_data, variables) => {
      if (!variables.preview) {
        await queryClient.invalidateQueries({
          queryKey: ["platform", "audit-logs"],
        });
      }
    },
  });
}

export function useCreatePlatformTestimonialMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      tenant_id?: string;
      author_name: string;
      author_role: string;
      institution_name: string;
      quote: string;
      avatar_url?: string | null;
      rating?: number;
      status?: "draft" | "pending_review" | "published" | "rejected";
      highlighted?: boolean;
      sort_order?: number;
    }) =>
      apiRequest<{ testimonial: LandingTestimonial }>(
        "/api/platform/testimonials",
        {
          method: "POST",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["platform", "testimonials"],
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.landing() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.public.testimonials(),
        }),
      ]);
    },
  });
}

export function useUpdatePlatformTestimonialMutation(testimonialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      author_name?: string;
      author_role?: string;
      institution_name?: string;
      quote?: string;
      avatar_url?: string | null;
      rating?: number;
      status?: "draft" | "pending_review" | "published" | "rejected";
      highlighted?: boolean;
      sort_order?: number;
    }) =>
      apiRequest<{ testimonial: LandingTestimonial }>(
        `/api/platform/testimonials/${testimonialId}`,
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["platform", "testimonials"],
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.landing() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.public.testimonials(),
        }),
      ]);
    },
  });
}

export function useDeletePlatformTestimonialMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (testimonialId: string) =>
      apiRequest<{ message: string }>(
        `/api/platform/testimonials/${testimonialId}`,
        { method: "DELETE", auth: "admin" },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["platform", "testimonials"],
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.landing() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.public.testimonials(),
        }),
      ]);
    },
  });
}
