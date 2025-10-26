import { create } from "zustand";
import api from "@/lib/api";
import {
  VotingSession,
  CreateSessionDto,
  UpdateSessionDto,
  SessionStats,
} from "@/types/session";

interface SessionState {
  sessions: VotingSession[];
  currentSession: VotingSession | null;
  sessionStats: SessionStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Actions
  fetchSessions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => Promise<void>;
  fetchSessionById: (id: string) => Promise<void>;
  createSession: (data: CreateSessionDto) => Promise<void>;
  updateSession: (id: string, data: UpdateSessionDto) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  fetchSessionStats: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  sessionStats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  fetchSessions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ sessions: VotingSession[] }>(
        "/api/admin/sessions",
        { params }
      );
      set({
        sessions: response.data.sessions,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch sessions",
      });
      throw error;
    }
  },

  fetchSessionById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        session: VotingSession;
        stats: {
          eligible_students: number;
          total_votes: number;
          duplicate_attempts: number;
          rejected_votes: number;
          turnout_percentage: string;
        };
      }>(`/api/admin/sessions/${id}`);

      // Group candidates by position for stats display
      const candidatesByPosition: {
        category: string;
        candidates: {
          name: string;
          vote_count: number;
          percentage: string;
          photo_url?: string;
        }[];
      }[] = [];

      if (response.data.session.candidates) {
        const grouped = response.data.session.candidates.reduce(
          (acc, candidate) => {
            if (!acc[candidate.position]) {
              acc[candidate.position] = [];
            }
            acc[candidate.position].push({
              name: candidate.name,
              vote_count: candidate.vote_count || 0,
              percentage: "0%",
              photo_url: candidate.photo_url,
            });
            return acc;
          },
          {} as Record<
            string,
            {
              name: string;
              vote_count: number;
              percentage: string;
              photo_url?: string;
            }[]
          >
        );

        Object.entries(grouped).forEach(([position, candidates]) => {
          const totalVotesInCategory = candidates.reduce(
            (sum, c) => sum + c.vote_count,
            0
          );
          candidatesByPosition.push({
            category: position,
            candidates: candidates.map((c) => ({
              ...c,
              percentage:
                totalVotesInCategory > 0
                  ? ((c.vote_count / totalVotesInCategory) * 100).toFixed(2) +
                    "%"
                  : "0%",
            })),
          });
        });
      }

      set({
        currentSession: response.data.session,
        sessionStats: {
          session: {
            id: response.data.session._id,
            title: response.data.session.title,
            status: response.data.session.status,
          },
          statistics: {
            eligible_students: response.data.stats.eligible_students,
            total_votes: response.data.stats.total_votes,
            unique_voters: response.data.stats.total_votes,
            duplicate_attempts: response.data.stats.duplicate_attempts,
            rejected_votes: response.data.stats.rejected_votes,
            turnout_percentage: response.data.stats.turnout_percentage,
          },
          candidates: candidatesByPosition,
        },
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch session",
      });
      throw error;
    }
  },

  createSession: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/api/admin/create-session", data);
      set({ isLoading: false });
      // Refresh session list
      get().fetchSessions();
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to create session",
      });
      throw error;
    }
  },

  updateSession: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/api/admin/update-session/${id}`, data);
      set({ isLoading: false });
      // Refresh session list
      get().fetchSessions();
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to update session",
      });
      throw error;
    }
  },

  deleteSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/admin/delete-session/${id}`);
      set({ isLoading: false });
      // Refresh session list
      get().fetchSessions();
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to delete session",
      });
      throw error;
    }
  },

  fetchSessionStats: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<SessionStats>(
        `/api/admin/session-stats/${id}`
      );
      set({
        sessionStats: response.data,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch session stats",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
