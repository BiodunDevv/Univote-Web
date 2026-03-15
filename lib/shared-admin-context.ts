import {
  buildPublicAppUrl,
  decodeTenantHandoffPayload,
  encodeTenantHandoffPayload,
} from "@/lib/tenant";
import type { TenantContext, TenantOrganization } from "@/types/tenant";

const SHARED_ADMIN_CONTEXT_COOKIE = "univote-shared-admin-context";
const SHARED_ADMIN_CONTEXT_STORAGE = "univote-shared-admin-context";
const SHARED_ADMIN_CONTEXT_EVENT = "univote:shared-admin-context";
const SHARED_ADMIN_CONTEXT_SYNC_FRAME = "__univote_shared_admin_context_sync__";
let cachedSharedAdminContextRaw: string | null | undefined;
let cachedSharedAdminContextValue: SharedAdminContext | null = null;

export type SharedAdminContext = {
  admin: {
    full_name: string;
    role: string;
  };
  tenant: TenantContext | null;
  organizations: TenantOrganization[];
  updated_at: string;
};

type SharedAdminContextOptions = {
  syncToRoot?: boolean;
};

function getCookieDomain() {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }

  const configuredRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ?.toLowerCase()
    .replace(/^\./, "")
    .replace(/\.$/, "");

  if (configuredRootDomain) {
    return configuredRootDomain;
  }

  const parts = hostname.split(".");
  if (parts.length <= 2) {
    return hostname;
  }

  return parts.slice(-2).join(".");
}

function readCookieValue(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));

  return entry ? entry.slice(prefix.length) : null;
}

function readStorageValue() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(SHARED_ADMIN_CONTEXT_STORAGE);
  } catch {
    return null;
  }
}

function writeStorageValue(context: SharedAdminContext | null) {
  if (typeof window === "undefined") return;

  try {
    if (!context) {
      window.localStorage.removeItem(SHARED_ADMIN_CONTEXT_STORAGE);
    } else {
      window.localStorage.setItem(
        SHARED_ADMIN_CONTEXT_STORAGE,
        JSON.stringify(context),
      );
    }
  } catch {
    return;
  } finally {
    cachedSharedAdminContextRaw = context ? JSON.stringify(context) : null;
    cachedSharedAdminContextValue = context;
    window.dispatchEvent(new Event(SHARED_ADMIN_CONTEXT_EVENT));
  }
}

function getRootOrigin() {
  if (typeof window === "undefined") return null;

  try {
    return new URL(buildPublicAppUrl("/")).origin;
  } catch {
    return null;
  }
}

function syncSharedContextToRoot(context: SharedAdminContext | null) {
  if (typeof window === "undefined") return;

  const rootOrigin = getRootOrigin();
  if (!rootOrigin || rootOrigin === window.location.origin) return;

  const syncUrl = new URL(buildPublicAppUrl("/auth/context-sync"));
  if (!context) {
    syncUrl.searchParams.set("clear", "1");
  } else {
    syncUrl.hash = `shared=${encodeTenantHandoffPayload(context)}`;
  }

  const mountFrame = () => {
    const existingFrame = document.getElementById(SHARED_ADMIN_CONTEXT_SYNC_FRAME);
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = SHARED_ADMIN_CONTEXT_SYNC_FRAME;
    iframe.src = syncUrl.toString();
    iframe.tabIndex = -1;
    iframe.ariaHidden = "true";
    iframe.style.display = "none";

    const cleanup = () => {
      window.setTimeout(() => iframe.remove(), 250);
    };

    iframe.addEventListener("load", cleanup, { once: true });
    iframe.addEventListener("error", cleanup, { once: true });
    document.body.appendChild(iframe);
  };

  if (!document.body) {
    window.requestAnimationFrame(mountFrame);
    return;
  }

  mountFrame();
}

function parseSharedAdminContext(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as SharedAdminContext;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(value)) as SharedAdminContext;
    } catch {
      try {
        return decodeTenantHandoffPayload<SharedAdminContext>(value);
      } catch {
        return null;
      }
    }
  }
}

export function readSharedAdminContext() {
  if (typeof window === "undefined") return cachedSharedAdminContextValue;

  const rawValue =
    readStorageValue() ?? readCookieValue(SHARED_ADMIN_CONTEXT_COOKIE) ?? null;

  if (rawValue === cachedSharedAdminContextRaw) {
    return cachedSharedAdminContextValue;
  }

  cachedSharedAdminContextRaw = rawValue;
  cachedSharedAdminContextValue = parseSharedAdminContext(rawValue);
  return cachedSharedAdminContextValue;
}

export function writeSharedAdminContext(
  context: SharedAdminContext | null,
  options: SharedAdminContextOptions = {},
) {
  if (typeof document === "undefined") return;

  const cookieDomain = getCookieDomain();
  const domainPart = cookieDomain ? `; Domain=${cookieDomain}` : "";
  const securePart = window.location.protocol === "https:" ? "; Secure" : "";

  writeStorageValue(context);

  if (!context) {
    document.cookie = `${SHARED_ADMIN_CONTEXT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${domainPart}${securePart}`;
    document.cookie = `${SHARED_ADMIN_CONTEXT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${securePart}`;
    cachedSharedAdminContextRaw = null;
    cachedSharedAdminContextValue = null;
    if (options.syncToRoot !== false) {
      syncSharedContextToRoot(null);
    }
    return;
  }

  const payload = encodeURIComponent(JSON.stringify(context));
  document.cookie = `${SHARED_ADMIN_CONTEXT_COOKIE}=${payload}; Path=/; Max-Age=1209600; SameSite=Lax${domainPart}${securePart}`;
  cachedSharedAdminContextRaw = JSON.stringify(context);
  cachedSharedAdminContextValue = context;

  if (options.syncToRoot !== false) {
    syncSharedContextToRoot(context);
  }
}

export function clearSharedAdminContext(options: SharedAdminContextOptions = {}) {
  writeSharedAdminContext(null, options);
}

export function subscribeSharedAdminContext(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleUpdate = () => listener();
  window.addEventListener("focus", handleUpdate);
  window.addEventListener("pageshow", handleUpdate);
  window.addEventListener("storage", handleUpdate);
  window.addEventListener(SHARED_ADMIN_CONTEXT_EVENT, handleUpdate);
  document.addEventListener("visibilitychange", handleUpdate);

  return () => {
    window.removeEventListener("focus", handleUpdate);
    window.removeEventListener("pageshow", handleUpdate);
    window.removeEventListener("storage", handleUpdate);
    window.removeEventListener(SHARED_ADMIN_CONTEXT_EVENT, handleUpdate);
    document.removeEventListener("visibilitychange", handleUpdate);
  };
}
