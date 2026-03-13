"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type {
  CandidateMutationDto,
  CreateSessionDto,
  SessionCandidate,
  SessionListResponse,
  SessionOverviewSummary,
  UpdateSessionDto,
  VotingSession,
} from "@/types/session";
import type { Student, StudentCSVData, UploadStudentsResponse } from "@/types/student";
import type {
  DatabaseStats,
  NotificationPreferences,
  SystemConfig,
  SystemHealth,
} from "@/lib/store/useSettingsStore";

type QueryHookOptions = {
  enabled?: boolean;
};

type AdminDashboardData = {
  overview: {
    total_students: number;
    active_students: number;
    total_sessions: number;
    active_sessions: number;
    upcoming_sessions: number;
    ended_sessions: number;
    total_votes: number;
    total_colleges: number;
    total_departments: number;
    participation_rate: number;
    avg_votes_per_session: number;
    new_students_7days: number;
  };
  distributions: {
    students_by_level: Array<{ level: string; count: number }>;
    students_by_college: Array<{ college: string; count: number }>;
  };
  recent_sessions: Array<{
    _id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    vote_count: number;
  }>;
  top_voters: Array<{
    matric_no: string;
    full_name: string;
    department: string;
    college: string;
    votes_cast: number;
  }>;
  vote_trend: Array<{
    date: string;
    votes: number;
  }>;
  recent_activities: Array<{
    id: string;
    user_type: string;
    user_name: string;
    action: string;
    resource: string;
    timestamp: string;
    status: string;
  }>;
  timestamp: string;
  fetch_time_ms?: number;
};

export type AdminStudentsOverview = {
  totals: {
    total_students: number;
    active_students: number;
    inactive_students: number;
    with_facial_data: number;
  };
  colleges: Array<{
    id: string;
    name: string;
    code: string;
    departments: Array<{
      id: string;
      name: string;
      code: string;
    }>;
  }>;
  by_college: Array<{
    college: string;
    total: number;
    active: number;
  }>;
  by_department: Array<{
    college: string;
    department: string;
    total: number;
  }>;
};

export type AdminStudentListResponse = {
  students: Student[];
  total: number;
  page: number;
  pages: number;
  filter?: {
    college?: string;
    department?: string;
    level?: string;
  };
};

export type AdminStudentDetailResponse = {
  student: Student;
  voting_history: Array<{
    _id: string;
    session_id: {
      _id: string;
      title: string;
      start_time: string;
      end_time: string;
    };
    status: string;
    timestamp?: string;
    voted_at?: string;
  }>;
};

export type AdminCollegesResponse = {
  colleges: Array<{
    _id: string;
    name: string;
    code: string;
    description?: string;
    dean_name?: string;
    dean_email?: string;
    departments: Array<{
      _id: string;
      name: string;
      code: string;
      description?: string;
      hod_name?: string;
      hod_email?: string;
      available_levels: string[];
      is_active: boolean;
      student_count: number;
    }>;
    is_active: boolean;
    student_count: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type AdminCollegeStatistics = {
  statistics: {
    total_colleges: number;
    active_colleges: number;
    inactive_colleges: number;
    total_departments: number;
    total_students: number;
    colleges_breakdown: Array<{
      id: string;
      name: string;
      code: string;
      department_count: number;
      student_count: number;
      is_active: boolean;
    }>;
  };
};

export type AdminDepartmentsResponse = {
  departments: Array<{
    _id: string;
    name: string;
    code: string;
    description: string;
    hod_name: string;
    hod_email: string;
    available_levels: string[];
    is_active: boolean;
    student_count: number;
    college: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  page: number;
  pages: number;
  total: number;
  limit: number;
};

export type AdminDepartmentsOverview = {
  totals: {
    total_departments: number;
    active_departments: number;
    inactive_departments: number;
    total_students: number;
  };
  colleges: Array<{
    id: string;
    name: string;
    code: string;
    department_count: number;
    student_count: number;
  }>;
};

export type AdminSessionDetailResponse = {
  session: VotingSession;
  stats: {
    eligible_students: number;
    total_votes: number;
    duplicate_attempts: number;
    rejected_votes: number;
    turnout_percentage: string;
  };
};

export type AdminSessionStatsResponse = {
  session: {
    id: string;
    title: string;
    status: string;
  };
  stats: {
    eligible_students: number;
    total_votes: number;
    duplicate_attempts: number;
    rejected_votes: number;
    turnout_percentage: string;
  };
  candidates: Array<{
    _id: string;
    name: string;
    position: string;
    photo_url?: string;
    vote_count: number;
  }>;
};

export type AdminCandidateDirectoryResponse = {
  candidates: Array<{
    _id: string;
    name: string;
    position: string;
    photo_url: string;
    bio?: string;
    manifesto?: string;
    vote_count: number;
    session_id: {
      _id: string;
      title: string;
      status: string;
      start_time: string;
      end_time: string;
      categories: string[];
    };
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    session_id: string | null;
    position: string | null;
    search: string | null;
    status: string | null;
  };
};

export type AdminResultsOverviewResponse = {
  overview: {
    total_sessions: number;
    upcoming_sessions: number;
    active_sessions: number;
    ended_sessions: number;
    total_students: number;
    total_votes: number;
    duplicate_attempts: number;
    rejected_votes: number;
    average_turnout: string | number;
  };
};

export type AdminDirectoryResponse = {
  admins: Array<{
    _id: string;
    email: string;
    full_name: string;
    role: "super_admin" | "admin";
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    last_login_at?: string | null;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

type StudentFilters = {
  college_id?: string;
  department_id?: string;
  level?: string;
  search?: string;
  is_active?: boolean;
  has_facial_data?: boolean;
  page?: number;
  limit?: number;
};

type CandidateFilters = {
  session_id?: string;
  position?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export function useAdminDashboardQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.dashboard.admin(),
    queryFn: ({ signal }) =>
      apiRequest<AdminDashboardData>("/api/dashboard/admin", {
        auth: "admin",
        params: { fresh: true },
        signal,
      }),
  });
}

export function useAdminSessionsQuery(
  filters: {
  page?: number;
  limit?: number;
  status?: string;
},
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.sessions.adminList(filters),
    queryFn: ({ signal }) =>
      apiRequest<SessionListResponse>("/api/admin/sessions", {
        auth: "admin",
        params: {
          ...filters,
          fresh: true,
        },
        signal,
      }),
  });
}

export function useAdminSessionSummaryQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.sessions.adminSummary(),
    queryFn: ({ signal }) =>
      apiRequest<{ summary: SessionOverviewSummary }>(
        "/api/admin/sessions/summary",
        {
          auth: "admin",
          params: { fresh: true },
          signal,
        },
      ),
  });
}

export function useAdminSessionDetailQuery(
  sessionId: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(sessionId),
    queryKey: queryKeys.sessions.adminDetail(sessionId),
    queryFn: ({ signal }) =>
      apiRequest<AdminSessionDetailResponse>(`/api/admin/sessions/${sessionId}`, {
        auth: "admin",
        params: { fresh: true },
        signal,
      }),
  });
}

export function useAdminSessionStatsQuery(
  sessionId: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(sessionId),
    queryKey: queryKeys.sessions.adminStats(sessionId),
    queryFn: ({ signal }) =>
      apiRequest<AdminSessionStatsResponse>(`/api/admin/session-stats/${sessionId}`, {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminStudentsQuery(
  filters: StudentFilters,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.students.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminStudentListResponse>("/api/admin/students", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useAdminStudentsOverviewQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.students.overview(),
    queryFn: ({ signal }) =>
      apiRequest<AdminStudentsOverview>("/api/admin/students/overview", {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminStudentDetailQuery(
  studentId: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(studentId),
    queryKey: queryKeys.students.detail(studentId),
    queryFn: ({ signal }) =>
      apiRequest<AdminStudentDetailResponse>(`/api/admin/students/${studentId}`, {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminCollegesQuery(
  filters: { is_active?: boolean } = {},
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.colleges.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminCollegesResponse>("/api/admin/colleges", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useAdminCollegeStatsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.colleges.stats(),
    queryFn: ({ signal }) =>
      apiRequest<AdminCollegeStatistics>("/api/admin/colleges/statistics", {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminDepartmentsQuery(filters: {
  search?: string;
  college_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}, options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.departments.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminDepartmentsResponse>("/api/admin/departments", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useAdminDepartmentsOverviewQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.departments.overview(),
    queryFn: ({ signal }) =>
      apiRequest<AdminDepartmentsOverview>("/api/admin/departments/overview", {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminNotificationsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.notifications(),
    queryFn: ({ signal }) =>
      apiRequest<{ notification_preferences: NotificationPreferences }>(
        "/api/admin/settings/notifications",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useAdminSystemConfigQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.system(),
    queryFn: ({ signal }) =>
      apiRequest<{ system_config: SystemConfig }>("/api/admin/settings/system", {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminSystemHealthQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.health(),
    queryFn: ({ signal }) =>
      apiRequest<{ health: SystemHealth }>("/api/admin/settings/health", {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminDatabaseStatsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.database(),
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

export function useAdminCandidatesQuery(
  filters: CandidateFilters,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.candidates.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminCandidateDirectoryResponse>("/api/admin/candidates", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useAdminResultsOverviewQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.results.overview(),
    queryFn: ({ signal }) =>
      apiRequest<AdminResultsOverviewResponse>("/api/results/stats/overview", {
        auth: "admin",
        signal,
      }),
  });
}

export function useAdminDirectoryQuery(filters: {
  page?: number;
  limit?: number;
  role?: string;
  is_active?: boolean;
}, options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.admins.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminDirectoryResponse>("/api/admin/admins", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSessionDto) =>
      apiRequest<{ session: VotingSession }>("/api/admin/create-session", {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sessions", "admin"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminSummary(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useUpdateSessionMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSessionDto) =>
      apiRequest<{ session: VotingSession }>(`/api/admin/update-session/${sessionId}`, {
        method: "PATCH",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sessions", "admin"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminSummary(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminDetail(sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminStats(sessionId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest<void>(`/api/admin/delete-session/${sessionId}`, {
        method: "DELETE",
        auth: "admin",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sessions", "admin"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminSummary(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useCreateCandidateMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CandidateMutationDto) =>
      apiRequest<{ candidate: SessionCandidate }>(
        `/api/admin/sessions/${sessionId}/candidates`,
        {
        method: "POST",
        auth: "admin",
        data: payload,
        },
      ).then((response) => response.candidate),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminDetail(sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminStats(sessionId),
        }),
        queryClient.invalidateQueries({ queryKey: ["candidates"] }),
      ]);
    },
  });
}

export function useUpdateCandidateMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      candidateId,
      payload,
    }: {
      candidateId: string;
      payload: CandidateMutationDto;
    }) =>
      apiRequest<{ candidate: SessionCandidate }>(
        `/api/admin/candidates/${candidateId}`,
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ).then((response) => response.candidate),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminDetail(sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminStats(sessionId),
        }),
        queryClient.invalidateQueries({ queryKey: ["candidates"] }),
      ]);
    },
  });
}

export function useDeleteCandidateMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateId: string) =>
      apiRequest<void>(`/api/admin/candidates/${candidateId}`, {
        method: "DELETE",
        auth: "admin",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminDetail(sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.adminStats(sessionId),
        }),
        queryClient.invalidateQueries({ queryKey: ["candidates"] }),
      ]);
    },
  });
}

export function useUploadStudentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      csvData,
      target,
    }: {
      csvData: StudentCSVData[];
      target?: {
        college?: string;
        department?: string;
        level?: string;
      };
    }) =>
      apiRequest<UploadStudentsResponse>("/api/admin/upload-students", {
        method: "POST",
        auth: "admin",
        data: {
          csv_data: csvData,
          target_college: target?.college,
          target_department: target?.department,
          target_level: target?.level,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useUpdateStudentMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Student>) =>
      apiRequest(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.detail(studentId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useBulkUpdateStudentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentIds,
      updates,
    }: {
      studentIds: string[];
      updates: Partial<Student>;
    }) =>
      apiRequest("/api/admin/students/bulk-update", {
        method: "PATCH",
        auth: "admin",
        data: {
          student_ids: studentIds,
          updates,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useActivateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      apiRequest(`/api/admin/students/${studentId}/activate`, {
        method: "PATCH",
        auth: "admin",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useDeactivateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      apiRequest(`/api/admin/students/${studentId}/deactivate`, {
        method: "PATCH",
        auth: "admin",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useDeleteStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, soft }: { studentId: string; soft?: boolean }) =>
      apiRequest(`/api/admin/students/${studentId}`, {
        method: "DELETE",
        auth: "admin",
        params: { soft: soft ? "true" : "false" },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin() }),
      ]);
    },
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      apiRequest("/api/admin/settings/notifications", {
        method: "PATCH",
        auth: "admin",
        data: preferences,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settings.notifications(),
      });
    },
  });
}

export function useTestEmailMutation() {
  return useMutation({
    mutationFn: (recipient_email: string) =>
      apiRequest("/api/admin/settings/test-email", {
        method: "POST",
        auth: "admin",
        data: { recipient_email },
      }),
  });
}

export function useTestFaceppMutation() {
  return useMutation({
    mutationFn: (image_url: string) =>
      apiRequest("/api/admin/settings/test-facepp", {
        method: "POST",
        auth: "admin",
        data: { image_url },
      }),
  });
}

export function useExportDataMutation() {
  return useMutation({
    mutationFn: ({
      dataType,
      format,
      filters,
    }: {
      dataType: string;
      format?: string;
      filters?: Record<string, unknown>;
    }) =>
      apiRequest<Blob>("/api/admin/settings/export", {
        method: "POST",
        auth: "admin",
        data: {
          data_type: dataType,
          format: format || "json",
          filters,
        },
        responseType: "blob",
      }),
  });
}
