export interface SessionLocation {
  name?: string;
  address?: string;
  lat: number;
  lng: number;
  radius_meters: number;
}

export interface SessionCandidate {
  _id?: string;
  client_id?: string;
  name: string;
  position: string;
  photo_url: string;
  bio: string;
  manifesto: string;
  vote_count?: number;
  uploading?: boolean;
}

export interface VotingSession {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "upcoming" | "active" | "ended";
  location: SessionLocation;
  categories: string[];
  total_votes: number;
  students_voted?: number;
  created_by: string;
  createdAt: string;
  updatedAt: string;
  eligible_college?: string | null;
  eligible_departments?: string[];
  eligible_levels?: string[];
  is_off_campus_allowed?: boolean;
  results_public?: boolean;
  candidates?: SessionCandidate[];
}

export interface CreateSessionDto {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: SessionLocation;
  categories: string[];
  eligible_college?: string | null;
  eligible_departments?: string[];
  eligible_levels?: string[];
  is_off_campus_allowed?: boolean;
  results_public?: boolean;
  candidates?: Array<{
    name: string;
    position: string;
    photo_url: string;
    bio?: string;
    manifesto?: string;
  }>;
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: SessionLocation;
  categories?: string[];
  eligible_college?: string | null;
  eligible_departments?: string[];
  eligible_levels?: string[];
  is_off_campus_allowed?: boolean;
  results_public?: boolean;
}

export interface CandidateMutationDto {
  name: string;
  position: string;
  photo_url: string;
  bio?: string;
  manifesto?: string;
}

export interface SessionListResponse {
  sessions: VotingSession[];
  cached?: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SessionOverviewSummary {
  total_sessions: number;
  active_sessions: number;
  upcoming_sessions: number;
  ended_sessions: number;
  total_votes: number;
}

export interface SessionStats {
  session: {
    id: string;
    title: string;
    status: string;
  };
  statistics: {
    eligible_students: number;
    total_votes: number;
    unique_voters: number;
    duplicate_attempts: number;
    rejected_votes: number;
    turnout_percentage: string;
  };
  candidates: {
    category: string;
    candidates: {
      name: string;
      vote_count: number;
      percentage: string;
      photo_url?: string;
    }[];
  }[];
}
