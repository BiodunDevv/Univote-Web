import type { TenantContext } from "@/types/tenant";

const TENANT_OVERRIDE_KEY = "tenant-slug-override";

type PersistedTenantState = {
  tenant?: TenantContext | null;
};

export function normalizeTenantSlug(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

function parsePersistedState<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as { state?: T };
    return parsed.state || null;
  } catch {
    return null;
  }
}

export function deriveTenantSlugFromHostname(hostname?: string | null) {
  const host =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : null);

  if (!host) return null;

  const normalized = host.toLowerCase().replace(/\.$/, "");
  if (normalized === "localhost" || /^[0-9.]+$/.test(normalized)) {
    return null;
  }

  if (normalized.endsWith(".localhost")) {
    const slug = normalized.slice(0, -".localhost".length).split(".")[0];
    return slug && slug !== "www" && slug !== "api"
      ? normalizeTenantSlug(slug)
      : null;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain) {
    const normalizedRootDomain = rootDomain.toLowerCase().replace(/^\./, "");
    if (normalized === normalizedRootDomain) {
      return null;
    }

    if (!normalized.endsWith(`.${normalizedRootDomain}`)) {
      return null;
    }

    const suffix = `.${normalizedRootDomain}`;
    const slug = normalized.slice(0, -suffix.length);
    return slug && slug !== "www" && slug !== "api"
      ? normalizeTenantSlug(slug)
      : null;
  }

  const parts = normalized.split(".");
  if (parts.length < 3) return null;

  return parts[0] && parts[0] !== "www" && parts[0] !== "api"
    ? normalizeTenantSlug(parts[0])
    : null;
}

export function getStoredTenantContext() {
  const adminState = parsePersistedState<PersistedTenantState>("auth-storage");
  if (adminState?.tenant?.slug) {
    return adminState.tenant;
  }

  const studentState =
    parsePersistedState<PersistedTenantState>("student-auth-storage");
  return studentState?.tenant || null;
}

export function getResolvedTenantSlug() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_TENANT_SLUG || null;
  }

  const override = localStorage.getItem(TENANT_OVERRIDE_KEY);
  if (override) return override;

  return (
    deriveTenantSlugFromHostname() ||
    getStoredTenantContext()?.slug ||
    process.env.NEXT_PUBLIC_TENANT_SLUG ||
    null
  );
}

function getTenantRootDomain(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  const configuredRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ?.toLowerCase()
    .replace(/^\./, "")
    .replace(/\.$/, "");

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return "localhost";
  }

  if (configuredRootDomain) {
    return configuredRootDomain;
  }

  const parts = normalized.split(".");
  if (parts.length <= 2) {
    return normalized;
  }

  return parts.slice(-2).join(".");
}

export function isTenantHost(slug: string | null | undefined, hostname?: string | null) {
  if (!slug) return false;
  return deriveTenantSlugFromHostname(hostname) === normalizeTenantSlug(slug);
}

export function buildTenantAppUrl(
  slug: string,
  path = "/dashboard",
  origin?: string | null,
) {
  const baseOrigin =
    origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  const baseUrl = new URL(baseOrigin);
  const rootDomain = getTenantRootDomain(baseUrl.hostname);
  const targetSlug = normalizeTenantSlug(slug);
  const targetOrigin = `${baseUrl.protocol}//${targetSlug}.${rootDomain}${baseUrl.port ? `:${baseUrl.port}` : ""}`;

  return new URL(path, targetOrigin).toString();
}

export function buildPublicAppUrl(path = "/", origin?: string | null) {
  const baseOrigin =
    origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  const baseUrl = new URL(baseOrigin);
  const rootDomain = getTenantRootDomain(baseUrl.hostname);
  const targetOrigin = `${baseUrl.protocol}//${rootDomain}${baseUrl.port ? `:${baseUrl.port}` : ""}`;
  return new URL(path, targetOrigin).toString();
}

function encodeBase64Url(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof window === "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeTenantHandoffPayload(payload: unknown) {
  return encodeBase64Url(JSON.stringify(payload));
}

export function decodeTenantHandoffPayload<T>(payload: string) {
  return JSON.parse(decodeBase64Url(payload)) as T;
}

export function buildTenantAuthAcceptUrl(
  slug: string,
  ref: string,
  payload: unknown,
  origin?: string | null,
) {
  const baseUrl = new URL(buildTenantAppUrl(slug, "/auth/accept", origin));
  baseUrl.searchParams.set("ref", ref.startsWith("/") ? ref : "/dashboard");
  baseUrl.hash = `handoff=${encodeTenantHandoffPayload(payload)}`;
  return baseUrl.toString();
}

export function setTenantSlugOverride(slug: string | null) {
  if (typeof window === "undefined") return;

  if (!slug) {
    localStorage.removeItem(TENANT_OVERRIDE_KEY);
    return;
  }

  localStorage.setItem(TENANT_OVERRIDE_KEY, slug);
}
