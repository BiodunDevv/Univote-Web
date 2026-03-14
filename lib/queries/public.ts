"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type {
  PublicLandingResponse,
  PublicOrganization,
  TenantApplicationPayload,
  TenantApplicationResponse,
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
    mutationFn: (payload: TenantApplicationPayload) =>
      apiRequest<TenantApplicationResponse>("/api/public/tenant-applications", {
        method: "POST",
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.public.landing() });
    },
  });
}
