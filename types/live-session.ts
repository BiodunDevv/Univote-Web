export type LiveBreakdownEntry = {
  name: string;
  eligible: number;
  voted: number;
  not_voted: number;
  turnout_percentage: number;
};

export type PublicLiveSessionResponse = {
  organization: {
    id: string | null;
    name: string | null;
    slug: string | null;
    branding?: Record<string, unknown>;
  };
  session: {
    id: string;
    title: string;
    description?: string;
    status: "upcoming" | "active" | "ended";
    start_time: string;
    end_time: string;
    live_public_code: string;
    is_live: boolean;
  };
  totals: {
    eligible: number;
    voted: number;
    not_voted: number;
    turnout_percentage: number;
    vote_rows?: number;
  };
  eligibility: {
    tenant_wide: boolean;
    college: string | null;
    departments: string[];
    levels: string[];
  };
  breakdowns: {
    colleges: LiveBreakdownEntry[];
    departments: LiveBreakdownEntry[];
    levels: LiveBreakdownEntry[];
  };
  last_updated: string;
  cached?: boolean;
};

export type AdminLiveSessionResponse = PublicLiveSessionResponse & {
  candidate_standings: Array<{
    position: string;
    total_votes: number;
    candidates: Array<{
      id: string;
      name: string;
      position: string;
      photo_url?: string;
      vote_count: number;
      percentage: number;
      is_leading: boolean;
    }>;
  }>;
  verification_summary: {
    total_attempts: number;
    accepted: number;
    rejected: number;
    lockouts: number;
    acceptance_rate: number;
  };
  recent_logs: Array<{
    id: string;
    timestamp: string;
    result: "accepted" | "rejected";
    failure_reason?: string | null;
    liveness_status?: string | null;
    confidence_band?: "high" | "medium" | "low" | null;
    threshold_used?: number | null;
    lockout_triggered: boolean;
    college: string;
    department: string;
    level: string;
    device_signal: "provided" | "missing";
    location_signal: "provided" | "missing";
  }>;
};
