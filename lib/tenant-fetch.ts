import { getResolvedTenantSlug } from "@/lib/tenant";

export function tenantFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  const tenantSlug = getResolvedTenantSlug();

  if (tenantSlug && !headers.has("X-Tenant-Slug")) {
    headers.set("X-Tenant-Slug", tenantSlug);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
