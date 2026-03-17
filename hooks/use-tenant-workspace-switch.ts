"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { isApiError } from "@/lib/api/client";
import {
  buildTenantAppUrl,
  buildTenantAuthAcceptUrl,
  isTenantHost,
} from "@/lib/tenant";

export function useTenantWorkspaceSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSession, switchOrganization } = useAuthStore();
  const [isSwitching, setIsSwitching] = useState(false);

  const currentRef = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const switchWorkspace = async (tenantSlug: string) => {
    const targetRef = currentRef.startsWith("/dashboard")
      ? currentRef
      : "/dashboard";

    setIsSwitching(true);
    try {
      const session = await switchOrganization(tenantSlug, false);

      if (session.tenant?.slug && !isTenantHost(session.tenant.slug)) {
        const handoffUrl = buildTenantAuthAcceptUrl(
          session.tenant.slug,
          targetRef,
          session,
        );
        window.location.assign(handoffUrl);
        return;
      }

      setSession(session);
      window.location.assign(targetRef);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        // If the public-host token is stale, jump directly to tenant host where
        // the latest tenant-scoped session may still be present.
        window.location.assign(buildTenantAppUrl(tenantSlug, targetRef));
        return;
      }

      throw error;
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    currentRef,
    isSwitching,
    switchWorkspace,
  };
}
