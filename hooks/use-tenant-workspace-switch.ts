"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildTenantAppUrl,
} from "@/lib/tenant";

export function useTenantWorkspaceSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      window.location.assign(buildTenantAppUrl(tenantSlug, targetRef));
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
