"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type {
  CheckoutResolution,
  CouponValidationResult,
  PublicLandingResponse,
  PublicOrganization,
  TenantApplicationPayload,
  TenantApplicationResponse,
  TenantApplicationStatusResponse,
} from "@/types/landing";

export function usePublicLandingQuery() {
  return useQuery({
    queryKey: queryKeys.public.landing(),
    queryFn: ({ signal }) =>
      apiRequest<PublicLandingResponse>("/api/public/landing", {
        signal,
      }),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicTestimonialsQuery() {
  return useQuery({
    queryKey: queryKeys.public.testimonials(),
    queryFn: ({ signal }) =>
      apiRequest<{ testimonials: PublicLandingResponse["testimonials"] }>(
        "/api/public/testimonials",
        {
          signal,
        },
      ),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicOrganizationsQuery(search = "") {
  return useQuery({
    queryKey: queryKeys.public.organizations(search),
    queryFn: ({ signal }) =>
      apiRequest<{ organizations: PublicOrganization[] }>("/api/public/organizations", {
        signal,
        params: search ? { search } : undefined,
      }),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicOrganizationQuery(slug: string, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(slug),
    queryKey: queryKeys.public.organization(slug),
    queryFn: ({ signal }) =>
      apiRequest<{ organization: PublicOrganization }>(`/api/public/organizations/${slug}`, {
        signal,
      }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSubmitTenantApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TenantApplicationPayload & { submit?: boolean }) =>
      apiRequest<TenantApplicationResponse>("/api/public/tenant-applications", {
        method: "POST",
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.public.landing() });
    },
  });
}

export function useUpdateTenantApplicationMutation(reference: string) {
  return useMutation({
    mutationFn: (payload: TenantApplicationPayload & { submit?: boolean }) =>
      apiRequest<TenantApplicationResponse>(`/api/public/applications/${reference}`, {
        method: "PATCH",
        data: payload,
      }),
  });
}

export function useTenantApplicationStatusQuery(reference: string, email: string, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(reference) && Boolean(email),
    queryKey: queryKeys.public.applicationStatus(reference, email),
    queryFn: ({ signal }) =>
      apiRequest<TenantApplicationStatusResponse>("/api/public/applications/status", {
        signal,
        params: { reference, email },
      }),
    staleTime: 1000 * 30,
  });
}

export function useRetryTenantApplicationCheckoutMutation(reference: string) {
  return useMutation({
    mutationFn: () =>
      apiRequest<TenantApplicationResponse>(`/api/public/applications/${reference}/checkout`, {
        method: "POST",
      }),
  });
}

export function useCouponValidationQuery(
  code: string,
  planCode: string,
  email: string,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && Boolean(code) && Boolean(planCode),
    queryKey: queryKeys.public.coupon(code, planCode, email),
    queryFn: ({ signal }) =>
      apiRequest<{ valid: boolean; coupon: CouponValidationResult }>(
        `/api/public/coupons/${encodeURIComponent(code)}/validate`,
        {
          signal,
          params: {
            plan_code: planCode,
            email: email || undefined,
          },
        },
      ),
    retry: false,
    staleTime: 1000 * 15,
  });
}

export function useResolveCheckoutMutation() {
  return useMutation({
    mutationFn: (reference: string) =>
      apiRequest<{ resolution: CheckoutResolution }>("/api/billing/verify-checkout", {
        method: "POST",
        data: { reference },
      }),
  });
}

export function useSubmitTestimonialMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      author_name: string;
      author_role: string;
      institution_name: string;
      quote: string;
      avatar_url?: string;
      rating?: number;
      source?: "public" | "tenant";
      tenant_id?: string;
    }) =>
      apiRequest<{ message: string }>("/api/public/testimonials/submissions", {
        method: "POST",
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.public.testimonials() });
    },
  });
}
