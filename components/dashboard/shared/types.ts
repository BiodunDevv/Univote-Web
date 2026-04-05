export type DashboardOverview = {
  total_students: number;
  active_sessions: number;
  total_colleges: number;
  total_departments: number;
  participation_rate?: number;
  total_votes?: number;
  avg_votes_per_session?: number;
  new_students_7days?: number;
};

export type DashboardRecentSession = {
  _id: string;
  title: string;
  status: "active" | "upcoming" | "completed" | string;
  start_time: string;
  vote_count: number;
};

export type DashboardTopVoter = {
  matric_no?: string | null;
  email?: string | null;
  display_identifier?: string | null;
  full_name: string;
  votes_cast: number;
};

export type DashboardRecentActivity = {
  id: string;
  action: string;
  user_name: string;
  user_type: string;
  timestamp: string;
};

export type StudentsByLevelItem = {
  level: string;
  students: number;
};

export type StudentsByCollegeItem = {
  college: string;
  students: number;
  fill: string;
};
