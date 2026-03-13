import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Types based on API response
interface DashboardOverview {
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
}

interface StudentDistribution {
  level: string;
  count: number;
}

interface CollegeDistribution {
  college: string;
  count: number;
}

interface RecentSession {
  _id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  vote_count: number;
}

interface TopVoter {
  matric_no: string;
  full_name: string;
  department: string;
  college: string;
  votes_cast: number;
}

interface VoteTrend {
  date: string;
  votes: number;
}

interface RecentActivity {
  id: string;
  user_type: string;
  user_name: string;
  action: string;
  resource: string;
  timestamp: string;
  status: string;
}

interface DashboardData {
  overview: DashboardOverview;
  distributions: {
    students_by_level: StudentDistribution[];
    students_by_college: CollegeDistribution[];
  };
  recent_sessions: RecentSession[];
  top_voters: TopVoter[];
  vote_trend: VoteTrend[];
  recent_activities: RecentActivity[];
  timestamp: string;
  fetch_time_ms?: number;
  cached?: boolean;
  cache_age?: number;
}

interface QuickStats {
  total_students: number;
  active_sessions: number;
  total_votes: number;
  pending_actions: number;
  fetch_time_ms?: number;
  cached?: boolean;
}

interface DashboardState {
  dashboardData: DashboardData | null;
  quickStats: QuickStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardData: (token: string) => Promise<void>;
  fetchQuickStats: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: null,
  quickStats: null,
  isLoading: false,
  error: null,

  fetchDashboardData: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/admin?fresh=true`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch dashboard data");
      }

      const data: DashboardData = await response.json();

      set({
        dashboardData: data,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data",
      });
      throw error;
    }
  },

  fetchQuickStats: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/stats?fresh=true`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch quick stats");
      }

      const data: QuickStats = await response.json();

      set({
        quickStats: data,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch quick stats",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
