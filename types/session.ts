export interface VotingCategory {
  name: string;
  description: string;
  max_votes: number;
}

export interface Location {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface VotingSession {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  location: Location;
  categories: VotingCategory[];
  is_geofenced: boolean;
  geofence_radius: number;
  total_votes: number;
  created_by: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: Location;
  categories: VotingCategory[];
  is_geofenced: boolean;
  geofence_radius?: number;
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: Location;
  categories?: VotingCategory[];
  is_geofenced?: boolean;
  geofence_radius?: number;
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
    }[];
  }[];
}
