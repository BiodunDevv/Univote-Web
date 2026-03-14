"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export type AnnouncementRecord = {
  id: string;
  owner_scope: "tenant" | "platform";
  tenant_id?: string | null;
  audience_scope: string;
  audience_tenant_ids: string[];
  channels: Array<"in_app" | "email">;
  title: string;
  body: string;
  cta_label?: string | null;
  cta_link?: string | null;
  status: "draft" | "published" | "failed";
  published_at?: string | null;
  expires_at?: string | null;
  delivery_summary?: {
    notifications_created?: number;
    emails_attempted?: number;
    emails_sent?: number;
    errors?: string[];
  };
  createdAt: string;
  updatedAt: string;
};

export function useAnnouncementsQuery() {
  return useQuery({
    queryKey: queryKeys.announcements.list(),
    queryFn: ({ signal }) =>
      apiRequest<{ announcements: AnnouncementRecord[] }>("/api/announcements", {
        auth: "admin",
        signal,
      }),
  });
}

export function useCreateAnnouncementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<{ announcement: AnnouncementRecord }>("/api/announcements", {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.announcements.list() });
    },
  });
}
