export type TrackedTenantApplication = {
  reference: string;
  email: string;
  name?: string | null;
  status?: string | null;
};

const TRACKED_APPLICATION_KEY = "tenant-application-tracker-v1";

export function readTrackedTenantApplication(): TrackedTenantApplication | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(TRACKED_APPLICATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrackedTenantApplication;
  } catch {
    return null;
  }
}

export function writeTrackedTenantApplication(value: TrackedTenantApplication) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(TRACKED_APPLICATION_KEY, JSON.stringify(value));
}

export function clearTrackedTenantApplication() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(TRACKED_APPLICATION_KEY);
}

export function shouldKeepTrackedApplication(status?: string | null) {
  return Boolean(
    status && !["active", "approved", "suspended"].includes(status),
  );
}
