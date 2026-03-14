"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationListResponse } from "@/types/notification";

export type NotificationScope = "admin" | "student";

type NotificationFilters = {
  unread_only?: boolean;
  page?: number;
  limit?: number;
};

function authScope(scope: NotificationScope) {
  return scope === "student" ? "student" : "admin";
}

function notificationPrefix(scope: NotificationScope) {
  return ["notifications", scope] as const;
}

export function useNotificationsQuery(
  scope: NotificationScope,
  filters: NotificationFilters = {},
) {
  return useQuery({
    queryKey: queryKeys.notifications.list(scope, filters),
    queryFn: ({ signal }) =>
      apiRequest<NotificationListResponse>("/api/notifications", {
        auth: authScope(scope),
        params: filters,
        signal,
      }),
  });
}

export function useNotificationSummaryQuery(scope: NotificationScope) {
  return useQuery({
    queryKey: queryKeys.notifications.summary(scope),
    queryFn: ({ signal }) =>
      apiRequest<NotificationListResponse>("/api/notifications", {
        auth: authScope(scope),
        params: {
          page: 1,
          limit: 1,
        },
        signal,
      }),
    select: (data) => data.summary.unread,
  });
}

export function useMarkNotificationReadMutation(scope: NotificationScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        auth: authScope(scope),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationPrefix(scope),
      });
    },
  });
}

export function useMarkAllNotificationsReadMutation(scope: NotificationScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest(`/api/notifications/read-all`, {
        method: "PATCH",
        auth: authScope(scope),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationPrefix(scope),
      });
    },
  });
}
