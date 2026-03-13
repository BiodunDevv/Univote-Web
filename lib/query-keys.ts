export const queryKeys = {
  dashboard: {
    admin: () => ["dashboard", "admin"] as const,
    student: () => ["dashboard", "student"] as const,
  },
  sessions: {
    adminList: (filters: Record<string, unknown>) =>
      ["sessions", "admin", "list", filters] as const,
    adminSummary: () => ["sessions", "admin", "summary"] as const,
    adminDetail: (id: string) => ["sessions", "admin", "detail", id] as const,
    adminStats: (id: string) => ["sessions", "admin", "stats", id] as const,
    studentList: (filters: Record<string, unknown>) =>
      ["sessions", "student", "list", filters] as const,
    studentDetail: (id: string) =>
      ["sessions", "student", "detail", id] as const,
    liveResults: (id: string) => ["sessions", "live-results", id] as const,
  },
  students: {
    list: (filters: Record<string, unknown>) =>
      ["students", "list", filters] as const,
    overview: () => ["students", "overview"] as const,
    detail: (id: string) => ["students", "detail", id] as const,
  },
  colleges: {
    list: (filters: Record<string, unknown>) =>
      ["colleges", "list", filters] as const,
    stats: () => ["colleges", "stats"] as const,
  },
  departments: {
    list: (filters: Record<string, unknown>) =>
      ["departments", "list", filters] as const,
    overview: () => ["departments", "overview"] as const,
  },
  settings: {
    profile: () => ["settings", "profile"] as const,
    system: () => ["settings", "system"] as const,
    health: () => ["settings", "health"] as const,
    database: () => ["settings", "database"] as const,
    notifications: () => ["settings", "notifications"] as const,
  },
  candidates: {
    list: (filters: Record<string, unknown>) =>
      ["candidates", "list", filters] as const,
    detail: (id: string) => ["candidates", "detail", id] as const,
  },
  results: {
    session: (id: string) => ["results", "session", id] as const,
    overview: () => ["results", "overview"] as const,
  },
  history: {
    voting: () => ["history", "voting"] as const,
  },
  studentProfile: {
    current: () => ["student-profile", "current"] as const,
  },
  admins: {
    list: (filters: Record<string, unknown>) =>
      ["admins", "list", filters] as const,
  },
} as const;
