"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, isApiError } from "@/lib/api/client";

function toErrorMessage(error: unknown) {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function shouldRetry(failureCount: number, error: unknown) {
  if (isApiError(error)) {
    if ([400, 401, 403, 404, 409, 422].includes(error.status)) {
      return false;
    }
  }

  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.state.data === undefined) return;
        if (query.meta?.suppressErrorToast) return;

        toast.error(toErrorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.suppressErrorToast) return;
        toast.error(toErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** Math.max(attemptIndex - 1, 0), 5000),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: {
        retry: (failureCount, error) => shouldRetry(failureCount, error),
      },
    },
  });
}
