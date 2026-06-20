"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type {
  Student,
  StudentCSVData,
  UploadStudentsResponse,
} from "@/types/student";
import type {
  DatabaseStats,
  NotificationPreferences,
  SystemConfig,
  SystemHealth,
} from "@/lib/store/useSettingsStore";
import type { TenantContext } from "@/types/tenant";
import type { AdminLiveSessionResponse } from "@/types/live-session";

type QueryHookOptions = {
  enabled?: boolean;
};

type AdminDashboardData = {
  tenant?: TenantContext | null;
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
    matric_no?: string | null;
    email?: string | null;
    display_identifier?: string | null;
    full_name: string;
    department?: string | null;
    college?: string | null;
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
  levels: string[];
};

export type AdminAuditLogEntry = {
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
};

export type AdminAuditLogsResponse = {
  audit_logs: AdminAuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type AdminAuditActionsResponse = {
  actions: string[];
  total: number;
};

export type AdminBiometricTestResponse = {
  message: string;
  test_result: {
    success: boolean;
    face_detected: boolean;
    face_count?: number;
    quality?: {
      brightness?: number | null;
      sharpness?: number | null;
    } | null;
  };
  configuration: {
    configured: boolean;
    status: string;
  };
};

export type BiometricMetricSummary = {
  total_attempts: number;
  accepted_attempts: number;
  rejected_attempts: number;
  liveness_passed_attempts: number;
  liveness_failed_attempts: number;
  lockout_count: number;
  compare_success_count: number;
  compare_reject_count: number;
  pass_rate: number;
  reject_rate: number;
  liveness_pass_rate: number;
  liveness_fail_rate: number;
  proxy_far: number;
  proxy_frr: number;
  proxy_accuracy: number;
  metric_mode: "operational_estimate";
};

export type AdminBiometricMetricsResponse = {
  threshold: number;
  metrics: {
    summary: BiometricMetricSummary;
    trends: Array<{
      date: string;
      accepted: number;
      rejected: number;
      lockouts: number;
    }>;
    confidence_trend: Array<{
      date: string;
      average_compare_confidence: number;
    }>;
    failure_reasons: Array<{
      reason: string;
      count: number;
    }>;
  };
};

export type AdminVerificationLogEntry = {
  id: string;
  tenant_id?: string | null;
  user_id: {
    id: string;
    full_name: string;
    matric_no?: string | null;
    email?: string | null;
  } | null;
  session_id: {
    id: string;
    title: string;
    status: string;
  } | null;
  reviewed_by: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  confidence_score: number | null;
  threshold_used: number | null;
  liveness_session_id?: string | null;
  liveness_status?: string | null;
  liveness_confidence?: number | null;
  liveness_threshold?: number | null;
  compare_confidence?: number | null;
  compare_threshold?: number | null;
  matched_face_id?: string | null;
  decision_source?: string | null;
  fail_streak?: number;
  lockout_triggered?: boolean;
  lockout_expires_at?: string | null;
  result: "accepted" | "rejected";
  failure_reason: string | null;
  is_genuine_attempt: boolean | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  provider: string;
  device_id?: string | null;
  ip_address?: string | null;
  geo_location?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
  image_url?: string | null;
  timestamp: string;
};

export type AdminVerificationLogsResponse = {
  logs: AdminVerificationLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type AdminTestingLivenessSessionResponse = {
  session_id: string;
  provider: string;
  region: string;
  configured: boolean;
  required: boolean;
};

export type AdminTestingLivenessResultResponse = {
  session_id: string;
  provider: string;
  passed: boolean;
  confidence: number | null;
  threshold: number | null;
  status: string | null;
};

export type AdminTestingCompareResponse = {
  student: {
    id: string;
    full_name: string;
    matric_no?: string | null;
    email?: string | null;
  };
  decision: "accepted" | "rejected";
  compare_confidence: number | null;
  compare_threshold: number | null;
  matched_face_id: string | null;
  provider: string;
  provider_code: string;
  provider_label: string;
  message: string;
  decision_source: string;
};

export type TenantProfileSettingsResponse = {
  tenant: TenantContext;
  labels?: TenantContext["labels"];
  identity?: TenantContext["identity"];
  auth_policy?: TenantContext["auth_policy"];
  participant_fields?: TenantContext["participant_fields"];
  eligibility_policy?: TenantContext["eligibility_policy"];
  entitlements?: TenantContext["entitlements"];
};

export type TenantIdentitySettingsResponse = {
  identity: TenantContext["identity"];
  labels?: TenantContext["labels"];
  catalog?: Record<string, unknown>;
  platform?: Record<string, unknown>;
  entitlements?: TenantContext["entitlements"];
};

export type TenantLabelSettingsResponse = {
  labels: TenantContext["labels"];
  entitlements?: TenantContext["entitlements"];
};

export type TenantAuthPolicySettingsResponse = {
  auth_policy: TenantContext["auth_policy"];
  support?: {
    allow_participant_tickets?: boolean;
  };
  notifications?: {
    email_enabled?: boolean;
    in_app_enabled?: boolean;
    push_enabled?: boolean;
  };
  voting?: {
    require_face_verification?: boolean;
  };
  participant_fields?: TenantContext["participant_fields"];
  eligibility_policy?: TenantContext["eligibility_policy"];
  entitlements?: TenantContext["entitlements"];
};

export type TenantParticipantFieldsResponse = {
  participant_fields: TenantContext["participant_fields"];
  eligibility_policy?: TenantContext["eligibility_policy"];
  defaults?: Record<string, unknown>;
  platform?: Record<string, unknown>;
  entitlements?: TenantContext["entitlements"];
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

export type AdminCollegeDepartment = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  hod_name?: string;
  hod_email?: string;
  available_levels: string[];
  is_active: boolean;
  student_count: number;
};

export type AdminCollegeDetail = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  dean_name?: string;
  dean_email?: string;
  departments: AdminCollegeDepartment[];
  is_active: boolean;
  student_count: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCollegeDetailResponse = {
  college: AdminCollegeDetail;
};

export type AdminCollegeDetailStatsResponse = {
  college_id: string;
  college_name: string;
  college_code: string;
  total_departments: number;
  total_students: number;
  active_students: number;
  inactive_students: number;
  departments: Array<{
    department_id: string;
    department_name: string;
    department_code: string;
    is_active: boolean;
    total_students: number;
    active_students: number;
    inactive_students: number;
    level_distribution: Record<string, number>;
  }>;
};

export type CollegeMutationPayload = {
  name?: string;
  code?: string;
  description?: string;
  dean_name?: string;
  dean_email?: string;
  is_active?: boolean;
};

export type DepartmentMutationPayload = {
  name?: string;
  code?: string;
  description?: string;
  hod_name?: string;
  hod_email?: string;
  available_levels?: string[];
  is_active?: boolean;
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

export type AdminAnalyticsOverviewResponse = {
  overview: {
    total_students: number;
    students_who_voted: number;
    total_sessions: number;
    total_votes: number;
    active_sessions: number;
    upcoming_sessions: number;
    ended_sessions: number;
    average_turnout: number;
    participation_rate: number;
  };
  top_voters: Array<{
    matric_no?: string | null;
    email?: string | null;
    display_identifier?: string | null;
    full_name: string;
    department?: string | null;
    college?: string | null;
    votes_cast: number;
  }>;
  recent_activities: Array<{
    id: string;
    action: string;
    resource: string;
    status: string;
    timestamp: string;
    user_name: string;
  }>;
  vote_trend: Array<{
    date: string;
    votes: number;
  }>;
  turnout_snapshots: Array<{
    id: string;
    title: string;
    eligible_students: number;
    valid_votes: number;
    turnout_percentage: number;
  }>;
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

export type GlobalAdminDetailResponse = {
  admin: {
    _id?: string;
    id?: string;
    email: string;
    full_name: string;
    role: "super_admin" | "admin";
    is_active: boolean;
    createdAt?: string;
    updatedAt?: string;
    last_login_at?: string | null;
  };
};

export type TenantAdminMember = {
  id: string;
  tenant_id: string;
  admin_id: string;
  email: string;
  full_name: string;
  global_role: "super_admin" | "admin";
  is_global_active: boolean;
  role: "owner" | "admin" | "support" | "analyst";
  permissions: string[];
  is_active: boolean;
  last_access_at?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantAdminListResponse = {
  tenant?: {
    name: string;
    slug: string;
  };
  members: TenantAdminMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type TenantAdminDetailResponse = {
  member: TenantAdminMember;
};

export type TenantRoleCatalogResponse = {
  roles: Array<{
    code: "owner" | "admin" | "support" | "analyst";
    label: string;
    permissions: string[];
  }>;
};

export type TenantAdminOverviewResponse = {
  totals: {
    total_members: number;
    active_members: number;
    owners: number;
    admins: number;
    support: number;
    analysts: number;
  };
  roles: TenantRoleCatalogResponse["roles"];
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
      apiRequest<AdminSessionDetailResponse>(
        `/api/admin/sessions/${sessionId}`,
        {
          auth: "admin",
          params: { fresh: true },
          signal,
        },
      ),
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
      apiRequest<AdminSessionStatsResponse>(
        `/api/admin/session-stats/${sessionId}`,
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useAdminSessionLiveQuery(
  sessionId: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(sessionId),
    queryKey: queryKeys.sessions.adminLive(sessionId),
    queryFn: ({ signal }) =>
      apiRequest<AdminLiveSessionResponse>(
        `/api/admin/sessions/${sessionId}/live`,
        {
          auth: "admin",
          signal,
        },
      ),
    refetchInterval: (query) =>
      query.state.data?.session.is_live ? 5000 : 60000,
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
      apiRequest<AdminStudentListResponse>("/api/admin/participants", {
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
      apiRequest<AdminStudentsOverview>("/api/admin/participants/overview", {
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
      apiRequest<AdminStudentDetailResponse>(
        `/api/admin/participants/${studentId}`,
        {
          auth: "admin",
          signal,
        },
      ),
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
      apiRequest<AdminCollegesResponse>("/api/admin/structure/colleges", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useAdminCollegeDetailQuery(
  collegeId: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(collegeId),
    queryKey: queryKeys.colleges.detail(collegeId),
    queryFn: ({ signal }) =>
      apiRequest<AdminCollegeDetailResponse>(
        `/api/admin/structure/colleges/${collegeId}`,
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useAdminCollegeStatsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.colleges.stats(),
    queryFn: ({ signal }) =>
      apiRequest<AdminCollegeStatistics>(
        "/api/admin/structure/colleges/statistics",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useAdminCollegeDetailStatsQuery(
  collegeId: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(collegeId),
    queryKey: queryKeys.colleges.detailStats(collegeId),
    queryFn: ({ signal }) =>
      apiRequest<AdminCollegeDetailStatsResponse>(
        `/api/admin/structure/colleges/${collegeId}/stats`,
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useAdminDepartmentsQuery(
  filters: {
    search?: string;
    college_id?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  },
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.departments.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminDepartmentsResponse>("/api/admin/structure/departments", {
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
      apiRequest<AdminDepartmentsOverview>(
        "/api/admin/structure/departments/overview",
        {
          auth: "admin",
          signal,
        },
      ),
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

export function useAdminAuditLogsQuery(
  filters: {
    page?: number;
    limit?: number;
    action?: string;
    admin_id?: string;
    start_date?: string;
    end_date?: string;
  } = {},
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.auditLogs(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminAuditLogsResponse>("/api/admin/settings/audit-logs", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useAdminAuditActionsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.auditActions(),
    queryFn: ({ signal }) =>
      apiRequest<AdminAuditActionsResponse>(
        "/api/admin/settings/audit-actions",
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
      apiRequest<{ system_config: SystemConfig }>(
        "/api/admin/settings/system",
        {
          auth: "admin",
          signal,
        },
      ),
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

export function useAdminAnalyticsOverviewQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.analytics.overview(),
    queryFn: ({ signal }) =>
      apiRequest<AdminAnalyticsOverviewResponse>(
        "/api/admin/analytics/overview",
        {
          auth: "admin",
          params: { fresh: true },
          signal,
        },
      ),
  });
}

export function useAdminAdvancedSessionAnalyticsQuery(
  sessionId: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(sessionId),
    queryKey: queryKeys.analytics.session(sessionId),
    queryFn: ({ signal }) =>
      apiRequest<AdminSessionStatsResponse>(
        `/api/admin/analytics/sessions/${sessionId}`,
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useAdminBiometricMetricsQuery(
  filters: {
    session_id?: string;
    start_date?: string;
    end_date?: string;
  } = {},
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.biometricMetrics(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminBiometricMetricsResponse>(
        "/api/admin/settings/biometric-metrics",
        {
          auth: "admin",
          params: filters,
          signal,
        },
      ),
  });
}

export function useAdminVerificationLogsQuery(
  filters: {
    page?: number;
    limit?: number;
    session_id?: string;
    result?: string;
    failure_reason?: string;
    decision_source?: string;
    liveness_status?: string;
    start_date?: string;
    end_date?: string;
  } = {},
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.verificationLogs(filters),
    queryFn: ({ signal }) =>
      apiRequest<AdminVerificationLogsResponse>(
        "/api/admin/settings/verification-logs",
        {
          auth: "admin",
          params: filters,
          signal,
        },
      ),
  });
}

export function useTenantProfileSettingsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.tenantProfile(),
    queryFn: ({ signal }) =>
      apiRequest<TenantProfileSettingsResponse>(
        "/api/admin/settings/tenant-profile",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useTenantIdentitySettingsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.identity(),
    queryFn: ({ signal }) =>
      apiRequest<TenantIdentitySettingsResponse>("/api/admin/settings/identity", {
        auth: "admin",
        signal,
      }),
  });
}

export function useTenantLabelSettingsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.labels(),
    queryFn: ({ signal }) =>
      apiRequest<TenantLabelSettingsResponse>("/api/admin/settings/labels", {
        auth: "admin",
        signal,
      }),
  });
}

export function useTenantAuthPolicySettingsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.authPolicy(),
    queryFn: ({ signal }) =>
      apiRequest<TenantAuthPolicySettingsResponse>(
        "/api/admin/settings/auth-policy",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useTenantParticipantFieldsQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.settings.participantFields(),
    queryFn: ({ signal }) =>
      apiRequest<TenantParticipantFieldsResponse>(
        "/api/admin/settings/participant-fields",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useAdminDirectoryQuery(
  filters: {
    page?: number;
    limit?: number;
    role?: string;
    is_active?: boolean;
  },
  options?: QueryHookOptions,
) {
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

export function useGlobalAdminDetailQuery(
  id: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(id),
    queryKey: queryKeys.admins.detail(id),
    queryFn: ({ signal }) =>
      apiRequest<GlobalAdminDetailResponse>(`/api/admin/admins/${id}`, {
        auth: "admin",
        signal,
      }),
  });
}

export function useTenantAdminUsersQuery(
  filters: {
    page?: number;
    limit?: number;
    role?: string;
    is_active?: boolean;
    search?: string;
  },
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.admins.tenantList(filters),
    queryFn: ({ signal }) =>
      apiRequest<TenantAdminListResponse>("/api/admin/admin-users", {
        auth: "admin",
        params: filters,
        signal,
      }),
  });
}

export function useTenantAdminUserQuery(
  id: string,
  options?: QueryHookOptions,
) {
  return useQuery({
    enabled: (options?.enabled ?? true) && Boolean(id),
    queryKey: queryKeys.admins.tenantDetail(id),
    queryFn: ({ signal }) =>
      apiRequest<TenantAdminDetailResponse>(`/api/admin/admin-users/${id}`, {
        auth: "admin",
        signal,
      }),
  });
}

export function useTenantAdminOverviewQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.admins.tenantOverview(),
    queryFn: ({ signal }) =>
      apiRequest<TenantAdminOverviewResponse>(
        "/api/admin/admin-users/overview",
        {
          auth: "admin",
          signal,
        },
      ),
  });
}

export function useTenantRoleCatalogQuery(options?: QueryHookOptions) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.admins.tenantRoles(),
    queryFn: ({ signal }) =>
      apiRequest<TenantRoleCatalogResponse>(
        "/api/admin/admin-users/roles-catalog",
        {
          auth: "admin",
          signal,
        },
      ),
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useUpdateSessionMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSessionDto) =>
      apiRequest<{ session: VotingSession }>(
        `/api/admin/update-session/${sessionId}`,
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
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

export function useCreateCollegeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: Required<Pick<CollegeMutationPayload, "name" | "code">> &
        CollegeMutationPayload,
    ) =>
      apiRequest<AdminCollegeDetailResponse>("/api/admin/structure/colleges", {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["colleges"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useUpdateCollegeMutation(collegeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CollegeMutationPayload) =>
      apiRequest<AdminCollegeDetailResponse>(
        `/api/admin/structure/colleges/${collegeId}`,
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["colleges"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detail(collegeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detailStats(collegeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useCreateDepartmentMutation(collegeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: Required<Pick<DepartmentMutationPayload, "name" | "code">> &
        DepartmentMutationPayload,
    ) =>
      apiRequest<{
        message: string;
        department: AdminCollegeDepartment;
      }>(`/api/admin/structure/colleges/${collegeId}/departments`, {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["colleges"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detail(collegeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detailStats(collegeId),
        }),
      ]);
    },
  });
}

export function useUpdateDepartmentMutation(
  collegeId: string,
  departmentId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepartmentMutationPayload) =>
      apiRequest<{
        message: string;
        department: AdminCollegeDepartment;
      }>(
        `/api/admin/structure/colleges/${collegeId}/departments/${departmentId}`,
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["colleges"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detail(collegeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detailStats(collegeId),
        }),
      ]);
    },
  });
}

export function useDeleteDepartmentMutation(collegeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) =>
      apiRequest<{ message: string }>(
        `/api/admin/structure/colleges/${collegeId}/departments/${departmentId}`,
        {
          method: "DELETE",
          auth: "admin",
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["colleges"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detail(collegeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.colleges.detailStats(collegeId),
        }),
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useUpdateStudentMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Student>) =>
      apiRequest(`/api/admin/participants/${studentId}`, {
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
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
      apiRequest("/api/admin/participants/bulk-update", {
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useActivateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      apiRequest(`/api/admin/participants/${studentId}/activate`, {
        method: "PATCH",
        auth: "admin",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useDeactivateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      apiRequest(`/api/admin/participants/${studentId}/deactivate`, {
        method: "PATCH",
        auth: "admin",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useReinviteStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      apiRequest<{
        message: string;
        student: {
          id: string;
          matric_no?: string | null;
          email?: string | null;
          first_login: boolean;
        };
      }>(`/api/admin/participants/${studentId}/reinvite`, {
        method: "POST",
        auth: "admin",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.students.overview(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useDeleteStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, soft }: { studentId: string; soft?: boolean }) =>
      apiRequest(`/api/admin/participants/${studentId}`, {
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
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

export function useTestBiometricMutation() {
  return useMutation({
    mutationFn: (image_url: string) =>
      apiRequest<AdminBiometricTestResponse>("/api/admin/settings/test-biometric", {
        method: "POST",
        auth: "admin",
        data: { image_url },
      }),
  });
}

export function useCreateAdminTestingLivenessSessionMutation() {
  return useMutation({
    mutationFn: () =>
      apiRequest<AdminTestingLivenessSessionResponse>(
        "/api/admin/settings/testing/liveness/session",
        {
          method: "POST",
          auth: "admin",
        },
      ),
  });
}

export function fetchAdminTestingLivenessSessionResult(sessionId: string) {
  return apiRequest<AdminTestingLivenessResultResponse>(
    `/api/admin/settings/testing/liveness/session/${sessionId}`,
    {
      auth: "admin",
    },
  );
}

export function useAdminTestingCompareMutation() {
  return useMutation({
    mutationFn: ({
      studentId,
      imageUrl,
    }: {
      studentId: string;
      imageUrl: string;
    }) =>
      apiRequest<AdminTestingCompareResponse>("/api/admin/settings/testing/compare", {
        method: "POST",
        auth: "admin",
        data: {
          student_id: studentId,
          image_url: imageUrl,
        },
      }),
  });
}

export function useUpdateBiometricThresholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (face_match_threshold: number) =>
      apiRequest<{ message: string; threshold: number }>(
        "/api/admin/settings/biometric-threshold",
        {
          method: "PATCH",
          auth: "admin",
          data: { face_match_threshold },
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["settings", "biometric-metrics"],
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.system(),
        }),
      ]);
    },
  });
}

export function useUpdateTenantProfileSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<TenantProfileSettingsResponse>(
        "/api/admin/settings/tenant-profile",
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.tenantProfile(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.system(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useUpdateTenantIdentitySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<TenantIdentitySettingsResponse>("/api/admin/settings/identity", {
        method: "PATCH",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.identity() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.tenantProfile(),
        }),
      ]);
    },
  });
}

export function useUpdateTenantLabelSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<TenantLabelSettingsResponse>("/api/admin/settings/labels", {
        method: "PATCH",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.labels() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.tenantProfile(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.admin(),
        }),
      ]);
    },
  });
}

export function useUpdateTenantAuthPolicySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<TenantAuthPolicySettingsResponse>(
        "/api/admin/settings/auth-policy",
        {
          method: "PATCH",
          auth: "admin",
          data: payload,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.authPolicy(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.tenantProfile(),
        }),
      ]);
    },
  });
}

export function useReviewVerificationLogMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      is_genuine_attempt,
      review_note,
    }: {
      id: string;
      is_genuine_attempt: boolean;
      review_note?: string;
    }) =>
      apiRequest<{ message: string; log: AdminVerificationLogEntry }>(
        `/api/admin/settings/verification-logs/${id}/review`,
        {
          method: "PATCH",
          auth: "admin",
          data: { is_genuine_attempt, review_note },
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["settings", "verification-logs"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["settings", "biometric-metrics"],
        }),
      ]);
    },
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

export function useCreateTenantAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      email: string;
      password?: string;
      full_name: string;
      role: "owner" | "admin" | "support" | "analyst";
      permissions?: string[];
    }) =>
      apiRequest<TenantAdminDetailResponse>("/api/admin/admin-users", {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admins", "tenant-list"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admins.tenantOverview(),
        }),
      ]);
    },
  });
}

export function useUpdateTenantAdminUserMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      full_name?: string;
      role?: "owner" | "admin" | "support" | "analyst";
      permissions?: string[];
      is_active?: boolean;
    }) =>
      apiRequest<TenantAdminDetailResponse>(`/api/admin/admin-users/${id}`, {
        method: "PATCH",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admins", "tenant-list"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admins.tenantOverview(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admins.tenantDetail(id),
        }),
      ]);
    },
  });
}

export function useDeleteTenantAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent?: boolean }) =>
      apiRequest<{ message: string }>(`/api/admin/admin-users/${id}`, {
        method: "DELETE",
        auth: "admin",
        params: { permanent: permanent ? "true" : "false" },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admins", "tenant-list"] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admins.tenantOverview(),
        }),
      ]);
    },
  });
}

export function useCreateGlobalAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      full_name: string;
      role: "admin" | "super_admin";
    }) =>
      apiRequest<GlobalAdminDetailResponse>("/api/admin/create-admin", {
        method: "POST",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admins", "list"] });
    },
  });
}

export function useUpdateGlobalAdminMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      full_name?: string;
      role?: "admin" | "super_admin";
      is_active?: boolean;
    }) =>
      apiRequest<GlobalAdminDetailResponse>(`/api/admin/admins/${id}`, {
        method: "PATCH",
        auth: "admin",
        data: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admins", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["admins", "detail", id] }),
      ]);
    },
  });
}

export function useDeleteGlobalAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent?: boolean }) =>
      apiRequest<{ message: string }>(`/api/admin/admins/${id}`, {
        method: "DELETE",
        auth: "admin",
        params: { permanent: permanent ? "true" : "false" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admins", "list"] });
    },
  });
}
