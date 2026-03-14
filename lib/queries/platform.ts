"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { TenantContext } from "@/types/tenant";
import type { DatabaseStats, SystemHealth } from "@/lib/store/useSettingsStore";
import type { LandingTestimonial } from "@/types/landing";

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
        application_submitted_at?: string | null;
        activated_at?: string | null;
        approved_at?: string | null;
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
    primary_domain?: string | null;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    onboarding?: {
      contact_name?: string | null;
      contact_email?: string | null;
      activated_at?: string | null;
      approved_at?: string | null;
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

export type BillingPlan = {
  code: string;
  name: string;
  rank: number;
  monthly_price_ngn: number;
  monthly_price_kobo: number;
  support_sla: string;
  limits: {
    admins: number;
    students: number;
    active_sessions: number;
  };
  entitlements: {
    custom_terminology?: boolean;
    custom_identity_policy?: boolean;
    custom_participant_structure?: boolean;
    custom_branding?: boolean;
    advanced_analytics?: boolean;
    advanced_reports?: boolean;
    realtime_support?: boolean;
    push_notifications?: boolean;
    face_verification?: boolean;
  };
  features: string[];
};

export type BillingInvoice = {
  id: string;
  invoice_number: string;
  plan_code: string;
  amount_ngn: number;
  amount_kobo: number;
  currency: string;
  interval: string;
  status: string;
  payment_provider: string;
  payment_reference?: string | null;
  provider_checkout_url?: string | null;
  issued_at: string;
  paid_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  createdAt: string;
};

export type PlatformBillingOverviewResponse = {
  plans: BillingPlan[];
  metrics: {
    total_tenants: number;
    active_subscriptions: number;
    scheduled_downgrades: number;
    monthly_recurring_revenue_ngn: number;
  };
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    plan_code: string;
    subscription_status: string;
    current_period_end?: string | null;
    scheduled_plan_code?: string | null;
    scheduled_plan_effective_at?: string | null;
  }>;
  invoices: BillingInvoice[];
};

export type PlatformTenantBillingResponse = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan_code: string;
    subscription_status: string;
  };
  billing: {
    billing_cycle: string;
    currency: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    grace_ends_at?: string | null;
    last_payment_at?: string | null;
    current_plan: BillingPlan;
    scheduled_change: {
      plan_code: string;
      name: string;
      effective_at: string;
      requested_at: string;
    } | null;
    invoices: BillingInvoice[];
  };
  plans: BillingPlan[];
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
  plan_entitlements: Record<string, unknown>;
  plans: BillingPlan[];
  biometrics: {
    active_provider: "facepp" | "aws_rekognition" | "azure_face" | "google_vision";
    provider_catalog: Record<
      string,
      {
        label: string;
        implemented: boolean;
      }
    >;
    providers: {
      facepp: {
        enabled: boolean;
        implemented: boolean;
        configured: boolean;
        api_key_masked?: string | null;
        api_secret_masked?: string | null;
        base_url: string;
        confidence_threshold: number;
      };
      aws_rekognition: {
        enabled: boolean;
        implemented: boolean;
        configured: boolean;
        access_key_id_masked?: string | null;
        secret_access_key_masked?: string | null;
        region: string;
        similarity_threshold: number;
      };
      azure_face: {
        enabled: boolean;
        implemented: boolean;
        configured: boolean;
        endpoint?: string | null;
        api_key_masked?: string | null;
        confidence_threshold: number;
      };
      google_vision: {
        enabled: boolean;
        implemented: boolean;
        configured: boolean;
        project_id?: string | null;
        api_key_masked?: string | null;
        confidence_threshold: number;
      };
    };
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

export function usePlatformTenantsQuery(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  subscription_status?: string;
} = {}) {
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
      apiRequest<PlatformTenantDetailResponse>(`/api/platform/tenants/${tenantId}`, {
        auth: "admin",
        signal,
      }),
  });
}

export function usePlatformSettingsQuery() {
  return useQuery({
    queryKey: ["platform", "settings"],
    queryFn: ({ signal }) =>
      apiRequest<PlatformBiometricsResponse>("/api/platform/settings/defaults", {
        auth: "admin",
        signal,
      }),
  });
}

export function useUpdatePlatformSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<PlatformBiometricsResponse>("/api/platform/settings/defaults", {
        method: "PATCH",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform", "settings"] });
    },
  });
}

export function useTestPlatformBiometricsMutation() {
  return useMutation({
    mutationFn: (imageUrl: string) =>
      apiRequest<{
        message: string;
        provider: string;
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
      }>("/api/platform/settings/biometrics/test", {
        method: "POST",
        auth: "admin",
        data: { image_url: imageUrl },
      }),
  });
}

export function usePlatformBillingOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.platform.billing(),
    queryFn: ({ signal }) =>
      apiRequest<PlatformBillingOverviewResponse>("/api/platform/billing", {
        auth: "admin",
        signal,
      }),
  });
}

export function usePlatformPlansQuery() {
  return useQuery({
    queryKey: queryKeys.platform.plans(),
    queryFn: ({ signal }) =>
      apiRequest<{ plans: BillingPlan[] }>("/api/platform/plans", {
        auth: "admin",
        signal,
      }),
  });
}

export function useUpdatePlatformPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      code,
      payload,
    }: {
      code: string;
      payload: Partial<BillingPlan>;
    }) =>
      apiRequest<{ message: string; plan: BillingPlan; plans: BillingPlan[] }>(
        `/api/platform/plans/${code}`,
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.plans() }),
        queryClient.invalidateQueries({ queryKey: ["platform", "settings"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.billing() }),
      ]);
    },
  });
}

export function usePlatformTenantBillingQuery(tenantId: string, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(tenantId),
    queryKey: queryKeys.platform.tenantBilling(tenantId),
    queryFn: ({ signal }) =>
      apiRequest<PlatformTenantBillingResponse>(`/api/platform/tenants/${tenantId}/billing`, {
        auth: "admin",
        signal,
      }),
  });
}

export function usePlatformAuditLogsQuery(filters: {
  page?: number;
  limit?: number;
  action?: string;
  admin_id?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
} = {}) {
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
      apiRequest<PlatformAuditActionsResponse>("/api/admin/settings/audit-actions", {
        auth: "admin",
        signal,
      }),
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

export function usePlatformTestimonialsQuery(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}) {
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
      plan_code?: "pro" | "pro_plus" | "enterprise";
      contact_name?: string;
      contact_email?: string;
      owner_admin_id?: string;
    }) =>
      apiRequest<{ tenant: PlatformTenantDetailResponse["tenant"] }>("/api/platform/tenants", {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.overview() }),
        queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.billing() }),
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
      plan_code?: "pro" | "pro_plus" | "enterprise";
      status?: "draft" | "pending_payment" | "pending_approval" | "active" | "suspended";
      subscription_status?: "trial" | "active" | "grace" | "expired" | "suspended";
      is_active?: boolean;
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
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.overview() }),
        queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenant(tenantId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenantBilling(tenantId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platform.billing() }),
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
        await queryClient.invalidateQueries({ queryKey: ["platform", "audit-logs"] });
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
      avatar_url?: string;
      rating?: number;
      status?: "draft" | "pending_review" | "published" | "rejected";
      highlighted?: boolean;
      sort_order?: number;
    }) =>
      apiRequest<{ testimonial: LandingTestimonial }>("/api/platform/testimonials", {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["platform", "testimonials"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.landing() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.testimonials() }),
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
      avatar_url?: string;
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
        queryClient.invalidateQueries({ queryKey: ["platform", "testimonials"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.landing() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.testimonials() }),
      ]);
    },
  });
}
