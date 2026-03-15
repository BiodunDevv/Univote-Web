"use client";

import { useEffect } from "react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { clearSharedAdminContext } from "@/lib/shared-admin-context";

export default function AuthSignoutPage() {
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    const target =
      next && next.startsWith("/") ? next : "/auth/signin";

    try {
      window.localStorage.removeItem("auth-storage");
      window.localStorage.removeItem("student-auth-storage");
      window.sessionStorage.removeItem("auth-storage");
      window.sessionStorage.removeItem("student-auth-storage");
    } catch {
      // Ignore storage cleanup failures and continue redirect.
    }

    clearSharedAdminContext({ syncToRoot: false });
    window.location.replace(target);
  }, []);

  return (
    <ChangingLoadingState
      fullHeight
      messages={[
        "Signing you out securely...",
        "Clearing workspace session...",
        "Returning to sign in...",
      ]}
    />
  );
}
