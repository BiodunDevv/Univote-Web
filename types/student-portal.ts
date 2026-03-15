import type { TenantContext } from "@/types/tenant";

export interface StudentPortalUser {
  id: string;
  matric_no?: string | null;
  member_id?: string | null;
  employee_id?: string | null;
  username?: string | null;
  display_identifier?: string | null;
  full_name: string;
  email: string;
  department: string;
  department_code: string;
  college: string;
  level: string;
  photo_url?: string | null;
  has_facial_data: boolean;
  has_voted_sessions?: string[];
  is_logged_in?: boolean;
  first_login?: boolean;
  last_login_at?: string | null;
  created_at?: string;
}

export interface StudentDashboardSession {
  _id: string;
  title: string;
  status: "upcoming" | "active" | "ended";
  start_time: string;
  end_time: string;
  has_voted: boolean;
}

export interface StudentDashboardNotification {
  type: string;
  message: string;
  count?: number;
  priority: "high" | "medium" | "low";
}

export interface StudentDashboardResponse {
  tenant?: TenantContext | null;
  student_info: {
    matric_no?: string | null;
    member_id?: string | null;
    employee_id?: string | null;
    username?: string | null;
    display_identifier?: string | null;
    full_name: string;
    email: string;
    department: string;
    college: string;
    level: string;
    photo_url?: string | null;
    has_facial_data: boolean;
    first_login?: boolean;
    member_since?: string;
    last_login?: string | null;
  };
  voting_stats: {
    total_votes_cast: number;
    eligible_sessions: number;
    active_sessions: number;
    upcoming_sessions: number;
    ended_sessions: number;
  };
  sessions: {
    eligible: StudentDashboardSession[];
    total_eligible: number;
  };
  voting_history: Array<{
    session: string;
    candidate: string;
    position: string;
    voted_at: string;
    face_match_score?: number | null;
  }>;
  recent_results: Array<{
    session_id: string;
    title: string;
    end_time: string;
    winners: Record<
      string,
      {
        name: string;
        vote_count: number;
      }
    >;
  }>;
  notifications: StudentDashboardNotification[];
  timestamp: string;
  fetch_time_ms?: number;
}

export interface StudentSessionCandidate {
  id: string;
  name: string;
  photo_url: string;
  bio?: string;
  manifesto?: string;
  vote_count?: number;
}

export interface StudentSessionEligibilityScope {
  tenant_wide: boolean;
  college?: string | null;
  departments: string[];
  levels: string[];
  summary: string;
}

export interface StudentSessionDetail {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "upcoming" | "active" | "ended";
  categories: string[];
  location?: {
    lat: number;
    lng: number;
    radius_meters: number;
  };
  is_off_campus_allowed: boolean;
  eligible: boolean;
  eligibility_reason?: string | null;
  eligibility_scope: StudentSessionEligibilityScope;
  has_voted: boolean;
  candidates_by_position: Record<string, StudentSessionCandidate[]>;
}

export interface StudentLiveResultGroup {
  position: string;
  total_votes: number;
  candidates: Array<{
    id: string;
    name: string;
    photo_url?: string;
    vote_count: number;
    percentage: number;
    is_leading: boolean;
  }>;
}

export interface StudentLiveResultsResponse {
  session: {
    id: string;
    title: string;
    description?: string;
    status: "upcoming" | "active" | "ended";
    start_time: string;
    end_time: string;
    is_live: boolean;
  };
  total_votes: number;
  last_updated: string;
  results: StudentLiveResultGroup[];
}

export interface StudentFinalResultsResponse {
  session: {
    id: string;
    title: string;
    description?: string;
    status: "upcoming" | "active" | "ended";
    start_time: string;
    end_time: string;
    results_public?: boolean;
  };
  is_eligible: boolean;
  has_voted: boolean;
  total_valid_votes: number;
  total_eligible: number;
  results: Array<{
    position: string;
    total_votes: number;
    candidates: Array<{
      id: string;
      name: string;
      photo_url?: string;
      bio?: string;
      vote_count: number;
      percentage: number;
      is_winner?: boolean;
    }>;
  }>;
}

export interface StudentVotingHistoryEntry {
  session: {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
  };
  votes: Array<{
    position: string;
    candidate: {
      id: string;
      name: string;
      photo_url?: string;
    };
  }>;
  voted_at: string;
}
