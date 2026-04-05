"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import {
  StudentDashboardResponse,
  StudentFinalResultsResponse,
  StudentLiveResultsResponse,
  StudentPortalUser,
  StudentSessionEligibilityScope,
  StudentSessionDetail,
  StudentVotingHistoryEntry,
} from "@/types/student-portal";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";

export type StudentSessionListItem = {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "upcoming" | "active" | "ended";
  location?: {
    lat: number;
    lng: number;
    radius_meters: number;
  };
  is_off_campus_allowed: boolean;
  eligible_college?: string;
  eligibility_scope?: StudentSessionEligibilityScope;
  has_voted: boolean;
  candidate_count: number;
  categories?: string[];
};

export function useStudentDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.student(),
    queryFn: ({ signal }) =>
      apiRequest<StudentDashboardResponse>("/api/dashboard/student", {
        auth: "student",
        signal,
      }),
  });
}

export function useStudentSessionsQuery(filters: { status?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.sessions.studentList(filters),
    queryFn: ({ signal }) =>
      apiRequest<{ sessions: StudentSessionListItem[] }>("/api/sessions", {
        auth: "student",
        params: filters,
        signal,
      }),
  });
}

export function useStudentSessionDetailQuery(sessionId: string) {
  return useQuery({
    enabled: Boolean(sessionId),
    queryKey: queryKeys.sessions.studentDetail(sessionId),
    queryFn: ({ signal }) =>
      apiRequest<{ session: StudentSessionDetail }>(`/api/sessions/${sessionId}`, {
        auth: "student",
        signal,
      }),
  });
}

export function useStudentLiveResultsQuery(
  sessionId: string,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(sessionId) && enabled,
    queryKey: queryKeys.sessions.liveResults(sessionId),
    queryFn: ({ signal }) =>
      apiRequest<StudentLiveResultsResponse>(
        `/api/sessions/${sessionId}/live-results`,
        {
          auth: "student",
          signal,
        },
      ),
    refetchInterval: 30_000,
  });
}

export function useStudentFinalResultsQuery(
  sessionId: string,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(sessionId) && enabled,
    queryKey: queryKeys.results.session(sessionId),
    queryFn: ({ signal }) =>
      apiRequest<StudentFinalResultsResponse>(`/api/results/${sessionId}`, {
        auth: "student",
        signal,
      }),
  });
}

export function useStudentVotingHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.history.voting(),
    queryFn: ({ signal }) =>
      apiRequest<{ history: StudentVotingHistoryEntry[] }>("/api/vote/history", {
        auth: "student",
        signal,
      }),
  });
}

export function useStudentProfileQuery() {
  const setStudent = useStudentAuthStore((state) => state.fetchProfile);

  return useQuery({
    queryKey: queryKeys.studentProfile.current(),
    queryFn: async () => {
      const student = await setStudent();
      return student;
    },
  });
}

export function useUpdateStudentProfileMutation() {
  const queryClient = useQueryClient();
  const updateProfile = useStudentAuthStore((state) => state.updateProfile);

  return useMutation({
    mutationFn: (payload: {
      full_name?: string;
      email?: string;
      photo_url?: string | null;
    }) => updateProfile(payload),
    onSuccess: async (student: StudentPortalUser) => {
      queryClient.setQueryData(queryKeys.studentProfile.current(), student);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.student(),
      });
    },
  });
}

export function useUpdateStudentPasswordMutation() {
  const updatePassword = useStudentAuthStore((state) => state.updatePassword);

  return useMutation({
    mutationFn: ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => updatePassword(oldPassword, newPassword),
  });
}

export function useSubmitVoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      choices,
      imageUrl,
      location,
      deviceId,
      livenessSessionId,
    }: {
      sessionId: string;
      choices: Array<{ candidate_id: string; category: string }>;
      imageUrl: string;
      location: { lat: number; lng: number };
      deviceId?: string;
      livenessSessionId?: string;
    }) =>
      apiRequest("/api/vote", {
        method: "POST",
        auth: "student",
        data: {
          session_id: sessionId,
          choices,
          image_url: imageUrl,
          lat: location.lat,
          lng: location.lng,
          device_id: deviceId,
          liveness_session_id: livenessSessionId,
        },
      }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.student(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["sessions", "student"],
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.studentDetail(variables.sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.results.session(variables.sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.liveResults(variables.sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.history.voting(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.studentProfile.current(),
        }),
      ]);
    },
  });
}

export type StudentVoteLivenessSession = {
  session_id: string;
  provider: string;
  region: string;
  configured: boolean;
  required: boolean;
};

export type StudentVoteLivenessResult = {
  session_id: string;
  provider: string;
  passed: boolean;
  confidence: number | null;
  threshold: number | null;
  status: string | null;
};

export function useCreateVoteLivenessSessionMutation() {
  return useMutation({
    mutationFn: () =>
      apiRequest<StudentVoteLivenessSession>("/api/vote/liveness/session", {
        method: "POST",
        auth: "student",
      }),
  });
}

export function fetchVoteLivenessSessionResult(sessionId: string) {
  return apiRequest<StudentVoteLivenessResult>(
    `/api/vote/liveness/session/${sessionId}`,
    {
      auth: "student",
    },
  );
}
