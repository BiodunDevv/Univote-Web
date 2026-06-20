"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type {
  PublicLandingResponse,
  PublicOrganization,
  TenantApplicationPayload,
  TenantApplicationResponse,
  TenantApplicationStatusResponse,
} from "@/types/landing";
import type { PublicLiveSessionResponse } from "@/types/live-session";

export function usePublicLandingQuery() {
  return useQuery({
    queryKey: queryKeys.public.landing(),
    queryFn: ({ signal }) =>
      apiRequest<PublicLandingResponse>("/api/public/landing", {
        signal,
      }),
    staleTime: 0,
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
    staleTime: 0,
  });
}

export function usePublicOrganizationsQuery(search = "") {
  return useQuery({
    queryKey: queryKeys.public.organizations(search),
    queryFn: ({ signal }) =>
      apiRequest<{ organizations: PublicOrganization[] }>(
        "/api/public/organizations",
        {
          signal,
          params: search ? { search } : undefined,
        },
      ),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicOrganizationQuery(slug: string, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(slug),
    queryKey: queryKeys.public.organization(slug),
    queryFn: ({ signal }) =>
      apiRequest<{ organization: PublicOrganization }>(
        `/api/public/organizations/${slug}`,
        {
          signal,
        },
      ),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicLiveSessionQuery(
  tenantSlug: string,
  liveCode: string,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && Boolean(tenantSlug) && Boolean(liveCode),
    queryKey: queryKeys.public.liveSession(tenantSlug, liveCode),
    queryFn: ({ signal }) =>
      apiRequest<PublicLiveSessionResponse>(
        `/api/public/live/${tenantSlug}/${liveCode}`,
        {
          signal,
          redirectOnAuthError: false,
        },
      ),
    refetchInterval: (query) =>
      query.state.data?.session.is_live ? 10000 : 60000,
  });
}

export function useSubmitTenantApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TenantApplicationPayload & { submit?: boolean }) =>
      apiRequest<TenantApplicationResponse>("/api/public/applications", {
        method: "POST",
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.public.landing(),
      });
    },
  });
}

export function useUpdateTenantApplicationMutation(reference: string) {
  return useMutation({
    mutationFn: (payload: TenantApplicationPayload & { submit?: boolean }) =>
      apiRequest<TenantApplicationResponse>(
        `/api/public/applications/${reference}`,
        {
          method: "PATCH",
          data: payload,
        },
      ),
  });
}

export function useTenantApplicationStatusQuery(
  email: string,
  reference?: string,
  enabled = true,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedReference = (reference || "").trim().toUpperCase();

  return useQuery({
    enabled: enabled && Boolean(normalizedEmail),
    queryKey: queryKeys.public.applicationStatus(
      normalizedEmail,
      normalizedReference,
    ),
    queryFn: ({ signal }) =>
      apiRequest<TenantApplicationStatusResponse>(
        "/api/public/applications/status",
        {
          signal,
          params: {
            email: normalizedEmail,
            reference: normalizedReference || undefined,
          },
        },
      ),
    staleTime: 1000 * 30,
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
      await queryClient.invalidateQueries({
        queryKey: queryKeys.public.testimonials(),
      });
    },
  });
}
