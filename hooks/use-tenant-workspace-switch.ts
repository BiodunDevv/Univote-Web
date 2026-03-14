"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { buildTenantAuthAcceptUrl, isTenantHost } from "@/lib/tenant";

export function useTenantWorkspaceSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSession, switchOrganization, logout } = useAuthStore();
  const [isSwitching, setIsSwitching] = useState(false);

  const currentRef = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const switchWorkspace = async (tenantSlug: string) => {
    setIsSwitching(true);
    try {
      const session = await switchOrganization(tenantSlug, false);
      const targetRef = currentRef.startsWith("/dashboard")
        ? currentRef
        : "/dashboard";

      if (session.tenant?.slug && !isTenantHost(session.tenant.slug)) {
        const handoffUrl = buildTenantAuthAcceptUrl(
          session.tenant.slug,
          targetRef,
          session,
        );
        logout();
        window.location.assign(handoffUrl);
        return;
      }

      setSession(session);
      window.location.assign(targetRef);
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
