export interface VotingCategory {
  name: string;
  description: string;
  max_votes: number;
}

export interface Location {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius_meters?: number;
}

export interface Candidate {
  _id?: string;
  name: string;
  position: string;
  photo_url?: string;
  bio?: string;
  manifesto?: string;
  vote_count?: number;
}

export interface VotingSession {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "upcoming" | "active" | "ended";
  location: Location;
  categories: VotingCategory[] | string[];
  is_geofenced: boolean;
  geofence_radius: number;
  total_votes: number;
  created_by: string;
  createdAt: string;
  updatedAt: string;
  eligible_college?: string;
  eligible_colleges?: string[];
  eligible_departments?: string[];
  eligible_levels?: string[];
  is_off_campus_allowed?: boolean;
  results_public?: boolean;
  candidates?: Candidate[];
}

export interface CreateSessionDto {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: Location;
  categories: VotingCategory[] | string[];
  is_geofenced?: boolean;
  geofence_radius?: number;
  eligible_college?: string;
  eligible_colleges?: string[];
  eligible_departments?: string[];
  eligible_levels?: string[];
  is_off_campus_allowed?: boolean;
  results_public?: boolean;
  candidates?: Candidate[];
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: Location;
  categories?: VotingCategory[] | string[];
  is_geofenced?: boolean;
  geofence_radius?: number;
  eligible_college?: string;
  eligible_colleges?: string[];
  eligible_departments?: string[];
  eligible_levels?: string[];
  is_off_campus_allowed?: boolean;
  results_public?: boolean;
  positions?: {
    name: string;
    max_candidates: number;
  }[];
}

export interface SessionListResponse {
  sessions: VotingSession[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
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
