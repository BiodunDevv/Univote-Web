"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type {
  SupportConversationResponse,
  SupportOverviewResponse,
  SupportScope,
  SupportTicketCategory,
  SupportTicketListResponse,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types/support";

function authFromScope(scope: SupportScope) {
  return scope === "student" ? "student" : "admin";
}

export function useSupportOverviewQuery(
  scope: SupportScope,
  filters: { tenant_id?: string } = {},
) {
  return useQuery({
    queryKey: queryKeys.support.overview(scope),
    queryFn: ({ signal }) =>
      apiRequest<SupportOverviewResponse>("/api/support/overview", {
        auth: authFromScope(scope),
        params: filters,
        signal,
      }),
  });
}

export function useSupportTicketsQuery(
  scope: SupportScope,
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    requester_type?: string;
    assigned_to_me?: boolean;
    tenant_id?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.support.tickets(scope, filters),
    queryFn: ({ signal }) =>
      apiRequest<SupportTicketListResponse>("/api/support/tickets", {
        auth: authFromScope(scope),
        params: filters,
        signal,
      }),
  });
}

export function useSupportConversationQuery(
  scope: SupportScope,
  ticketId: string,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(ticketId) && enabled,
    queryKey: queryKeys.support.messages(scope, ticketId),
    queryFn: ({ signal }) =>
      apiRequest<SupportConversationResponse>(`/api/support/tickets/${ticketId}/messages`, {
        auth: authFromScope(scope),
        signal,
      }),
  });
}

export function useCreateSupportTicketMutation(scope: SupportScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      subject: string;
      description: string;
      category?: SupportTicketCategory;
      priority?: SupportTicketPriority;
    }) =>
      apiRequest<{ ticket: SupportConversationResponse["ticket"] }>("/api/support/tickets", {
        method: "POST",
        auth: authFromScope(scope),
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.support.overview(scope) }),
        queryClient.invalidateQueries({ queryKey: ["support", scope, "tickets"] }),
      ]);
    },
  });
}

export function useUpdateSupportTicketMutation(scope: SupportScope, ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      status?: SupportTicketStatus;
      priority?: SupportTicketPriority;
      category?: SupportTicketCategory;
      assigned_admin_id?: string | null;
      profile_photo_reset?: boolean;
      photo_reset_decision?: "accepted" | "declined";
      decision_note?: string;
    }) =>
      apiRequest<{ ticket: SupportConversationResponse["ticket"] }>(
        `/api/support/tickets/${ticketId}`,
        {
          method: "PATCH",
          auth: authFromScope(scope),
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.support.overview(scope) }),
        queryClient.invalidateQueries({ queryKey: ["support", scope, "tickets"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.support.messages(scope, ticketId),
        }),
      ]);
    },
  });
}

export function useCreateSupportMessageMutation(scope: SupportScope, ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { body: string; attachments?: string[] }) =>
      apiRequest(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        auth: authFromScope(scope),
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.support.overview(scope) }),
        queryClient.invalidateQueries({ queryKey: ["support", scope, "tickets"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.support.messages(scope, ticketId),
        }),
      ]);
    },
  });
}
