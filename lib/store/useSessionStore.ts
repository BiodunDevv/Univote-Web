import { create } from "zustand";
import api from "@/lib/api";
import {
  VotingSession,
  CreateSessionDto,
  UpdateSessionDto,
  SessionStats,
  SessionListResponse,
  SessionOverviewSummary,
  CandidateMutationDto,
  SessionCandidate,
} from "@/types/session";

interface SessionState {
  sessions: VotingSession[];
  currentSession: VotingSession | null;
  sessionStats: SessionStats | null;
  sessionSummary: SessionOverviewSummary | null;
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
  fetchSessionsSummary: () => Promise<void>;
  fetchSessionById: (id: string) => Promise<void>;
  createSession: (data: CreateSessionDto) => Promise<void>;
  updateSession: (id: string, data: UpdateSessionDto) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  createCandidate: (
    sessionId: string,
    data: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  updateCandidate: (
    candidateId: string,
    data: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  deleteCandidate: (candidateId: string) => Promise<void>;
  fetchSessionStats: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  sessionStats: null,
  sessionSummary: null,
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
      const response = await api.get<SessionListResponse>(
        "/api/admin/sessions",
        {
          params: {
            ...params,
            fresh: true,
          },
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      set({
        sessions: response.data.sessions,
        pagination: response.data.pagination || get().pagination,
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

  fetchSessionsSummary: async () => {
    try {
      const response = await api.get<{
        summary: SessionOverviewSummary;
      }>("/api/admin/sessions/summary", {
        params: { fresh: true },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      set({ sessionSummary: response.data.summary });
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch sessions summary",
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
      }>(`/api/admin/sessions/${id}`, {
        params: { fresh: true },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

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
          >,
        );

        Object.entries(grouped).forEach(([position, candidates]) => {
          const totalVotesInCategory = candidates.reduce(
            (sum, c) => sum + c.vote_count,
            0,
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
      const response = await api.post<{ session: VotingSession }>(
        "/api/admin/create-session",
        data,
      );
      set({ isLoading: false });

      const createdSession = response.data.session;
      if (createdSession) {
        set((state) => ({
          sessions: [createdSession, ...state.sessions],
        }));
      }

      await Promise.allSettled([
        get().fetchSessions(),
        get().fetchSessionsSummary(),
      ]);
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
      await Promise.allSettled([
        get().fetchSessions(),
        get().fetchSessionsSummary(),
      ]);
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
      set((state) => ({
        isLoading: false,
        sessions: state.sessions.filter((session) => session._id !== id),
      }));
      await Promise.allSettled([
        get().fetchSessions(),
        get().fetchSessionsSummary(),
      ]);
    } catch (error: unknown) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to delete session",
      });
      throw error;
    }
  },

  createCandidate: async (sessionId, data) => {
    set({ error: null });
    try {
      const response = await api.post<{ candidate: SessionCandidate }>(
        `/api/admin/sessions/${sessionId}/candidates`,
        data,
      );
      return response.data.candidate;
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create candidate",
      });
      throw error;
    }
  },

  updateCandidate: async (candidateId, data) => {
    set({ error: null });
    try {
      const response = await api.patch<{ candidate: SessionCandidate }>(
        `/api/admin/candidates/${candidateId}`,
        data,
      );
      return response.data.candidate;
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update candidate",
      });
      throw error;
    }
  },

  deleteCandidate: async (candidateId) => {
    set({ error: null });
    try {
      await api.delete(`/api/admin/candidates/${candidateId}`);
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete candidate",
      });
      throw error;
    }
  },

  fetchSessionStats: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<SessionStats>(
        `/api/admin/session-stats/${id}`,
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
