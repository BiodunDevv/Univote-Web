import { getResolvedTenantSlug } from "@/lib/tenant";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PersistedStoreState<T> = {
  state?: T;
};

type AuthScope = "admin" | "student" | "optional";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  auth?: AuthScope;
  body?: BodyInit | null;
  data?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
  signal?: AbortSignal;
  responseType?: "json" | "blob" | "text";
  redirectOnAuthError?: boolean;
};

type StudentAuthSnapshot = {
  token?: string | null;
  firstLoginToken?: string | null;
  tenant?: {
    slug?: string | null;
  } | null;
};

type AdminAuthSnapshot = {
  token?: string | null;
  tenant?: {
    slug?: string | null;
  } | null;
};

type ErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
};

const AUTH_REDIRECT_CODES = new Set([
  "SESSION_INVALIDATED",
  "TOKEN_BLACKLISTED",
  "TOKEN_EXPIRED",
  "ACCOUNT_INACTIVE",
]);

const TENANT_RESTRICTION_CODES = new Set([
  "TENANT_ACCESS_RESTRICTED",
  "TENANT_SUSPENDED",
]);

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: ErrorPayload | null;

  constructor(
    message: string,
    status: number,
    code?: string,
    payload?: ErrorPayload | null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function readPersistedState<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as PersistedStoreState<T>;
    return parsed.state || null;
  } catch {
    return null;
  }
}

export function getStoredAdminToken() {
  const state = readPersistedState<AdminAuthSnapshot>("auth-storage");
  return state?.token || null;
}

export function getStoredAdminTenantSlug() {
  const state = readPersistedState<AdminAuthSnapshot>("auth-storage");
  return state?.tenant?.slug || null;
}

export function getStoredStudentToken() {
  const state = readPersistedState<StudentAuthSnapshot>("student-auth-storage");
  return state?.token || null;
}

export function getStoredStudentTenantSlug() {
  const state = readPersistedState<StudentAuthSnapshot>("student-auth-storage");
  return state?.tenant?.slug || null;
}

export function getStoredStudentFirstLoginToken() {
  const state = readPersistedState<StudentAuthSnapshot>("student-auth-storage");
  return state?.firstLoginToken || null;
}

export function clearStoredAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth-storage");
}

export function clearStoredStudentSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("student-auth-storage");
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const url = new URL(path, API_BASE_URL);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function selectToken(auth: AuthScope) {
  if (auth === "admin") return getStoredAdminToken();
  if (auth === "student") return getStoredStudentToken();
  return null;
}

function selectTenantSlug(auth: AuthScope) {
  if (auth === "admin") {
    return getStoredAdminTenantSlug() || getResolvedTenantSlug();
  }

  if (auth === "student") {
    return getStoredStudentTenantSlug() || getResolvedTenantSlug();
  }

  return getResolvedTenantSlug();
}

function getErrorMessage(payload: ErrorPayload | null, fallback: string) {
  if (!payload) return fallback;
  return payload.error || payload.message || fallback;
}

function handleAuthRedirect(auth: AuthScope) {
  if (typeof window === "undefined") return;

  const ref = `${window.location.pathname}${window.location.search}`;

  if (auth === "admin") {
    clearStoredAdminSession();
    window.location.assign(`/auth/signin?ref=${encodeURIComponent(ref)}`);
    return;
  }

  if (auth === "student") {
    clearStoredStudentSession();
    window.location.assign(`/students/login?ref=${encodeURIComponent(ref)}`);
  }
}

function handleTenantRestriction(auth: AuthScope, code?: string) {
  if (typeof window === "undefined") return;

  if (auth === "admin") {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (
      currentPath.startsWith("/dashboard/application") ||
      currentPath.startsWith("/dashboard/support")
    ) {
      return;
    }

    const reason = code || "tenant_restricted";
    window.location.assign(
      `/dashboard/application?reason=${encodeURIComponent(reason)}`,
    );
    return;
  }

  if (auth === "student") {
    clearStoredStudentSession();
    const ref = `${window.location.pathname}${window.location.search}`;
    const reason = code || "tenant_restricted";
    window.location.assign(
      `/students/login?reason=${encodeURIComponent(reason)}&ref=${encodeURIComponent(ref)}`,
    );
  }
}

function shouldRedirectOnAuthError(
  status: number,
  payload: ErrorPayload | null,
) {
  if (status === 401) return true;
  if (status !== 403) return false;

  if (payload?.code && AUTH_REDIRECT_CODES.has(payload.code)) {
    return true;
  }

  const message =
    `${payload?.error || ""} ${payload?.message || ""}`.toLowerCase();
  return message.includes("invalid token type");
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    auth = "optional",
    body,
    data,
    params,
    headers,
    signal,
    responseType = "json",
    redirectOnAuthError = true,
  }: ApiRequestOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);
  const token = selectToken(auth);
  const tenantSlug = selectTenantSlug(auth);

  if (!body && data !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (tenantSlug && !requestHeaders.has("X-Tenant-Slug")) {
    requestHeaders.set("X-Tenant-Slug", tenantSlug);
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: requestHeaders,
    body: body || (data !== undefined ? JSON.stringify(data) : undefined),
    signal,
    cache: "no-store",
  });

  let parsedPayload: ErrorPayload | null = null;

  if (responseType === "blob") {
    if (!response.ok) {
      try {
        parsedPayload = (await response.json()) as ErrorPayload;
      } catch {
        parsedPayload = null;
      }
    } else {
      return (await response.blob()) as T;
    }
  } else if (responseType === "text") {
    if (response.ok) {
      return (await response.text()) as T;
    }
  } else if (response.status !== 204) {
    try {
      parsedPayload = (await response.json()) as ErrorPayload;
    } catch {
      parsedPayload = null;
    }

    if (response.ok) {
      return parsedPayload as T;
    }
  }

  if (response.ok) {
    return undefined as T;
  }

  const error = new ApiError(
    getErrorMessage(parsedPayload, "Request failed"),
    response.status,
    parsedPayload?.code,
    parsedPayload,
  );

  if (
    redirectOnAuthError &&
    auth !== "optional" &&
    error.code &&
    TENANT_RESTRICTION_CODES.has(error.code)
  ) {
    handleTenantRestriction(auth, error.code);
  }

  if (
    redirectOnAuthError &&
    shouldRedirectOnAuthError(response.status, parsedPayload) &&
    auth !== "optional" &&
    error.code !== "FIRST_LOGIN"
  ) {
    handleAuthRedirect(auth);
  }

  throw error;
}
