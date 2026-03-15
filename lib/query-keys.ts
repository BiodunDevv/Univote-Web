export const queryKeys = {
  public: {
    landing: () => ["public", "landing"] as const,
    testimonials: () => ["public", "testimonials"] as const,
    organizations: (search: string) => ["public", "organizations", search] as const,
    organization: (slug: string) => ["public", "organization", slug] as const,
    applicationStatus: (reference: string, email: string) =>
      ["public", "application-status", reference, email] as const,
    coupon: (code: string, planCode: string, email: string) =>
      ["public", "coupon", code, planCode, email] as const,
  },
  announcements: {
    list: () => ["announcements", "list"] as const,
  },
  platform: {
    overview: () => ["platform", "overview"] as const,
    tenants: (filters: Record<string, unknown>) =>
      ["platform", "tenants", filters] as const,
    tenant: (tenantId: string) => ["platform", "tenant", tenantId] as const,
    billing: () => ["platform", "billing"] as const,
    plans: () => ["platform", "plans"] as const,
    tenantBilling: (tenantId: string) => ["platform", "tenant-billing", tenantId] as const,
    auditLogs: (filters: Record<string, unknown>) =>
      ["platform", "audit-logs", filters] as const,
    auditActions: () => ["platform", "audit-actions"] as const,
    systemHealth: () => ["platform", "system-health"] as const,
    databaseStats: () => ["platform", "database-stats"] as const,
    testimonials: (filters: Record<string, unknown>) =>
      ["platform", "testimonials", filters] as const,
    coupons: (filters: Record<string, unknown>) => ["platform", "coupons", filters] as const,
  },
  billing: {
    summary: () => ["billing", "summary"] as const,
    invoices: (filters: Record<string, unknown>) =>
      ["billing", "invoices", filters] as const,
  },
  analytics: {
    overview: () => ["analytics", "overview"] as const,
    session: (id: string) => ["analytics", "session", id] as const,
  },
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
    detail: (id: string) => ["colleges", "detail", id] as const,
    detailStats: (id: string) => ["colleges", "detail-stats", id] as const,
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
    auditLogs: (filters: Record<string, unknown>) =>
      ["settings", "audit-logs", filters] as const,
    auditActions: () => ["settings", "audit-actions"] as const,
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
  support: {
    overview: (scope: "student" | "admin") => ["support", scope, "overview"] as const,
    tickets: (scope: "student" | "admin", filters: Record<string, unknown>) =>
      ["support", scope, "tickets", filters] as const,
    detail: (scope: "student" | "admin", id: string) =>
      ["support", scope, "detail", id] as const,
    messages: (scope: "student" | "admin", id: string) =>
      ["support", scope, "messages", id] as const,
  },
  notifications: {
    summary: (scope: "student" | "admin") =>
      ["notifications", scope, "summary"] as const,
    list: (scope: "student" | "admin", filters: Record<string, unknown>) =>
      ["notifications", scope, "list", filters] as const,
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
    detail: (id: string) => ["admins", "detail", id] as const,
    tenantList: (filters: Record<string, unknown>) =>
      ["admins", "tenant-list", filters] as const,
    tenantDetail: (id: string) => ["admins", "tenant-detail", id] as const,
    tenantOverview: () => ["admins", "tenant-overview"] as const,
    tenantRoles: () => ["admins", "tenant-roles"] as const,
  },
} as const;
