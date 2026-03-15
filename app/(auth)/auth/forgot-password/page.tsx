"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordForm } from "@/components/Auth/forgot-password-form";
import {
  type AuthSessionData,
  useAuthStore,
} from "@/lib/store/useAuthStore";
import {
  buildTenantAppUrl,
  buildTenantAuthAcceptUrl,
  isTenantHost,
} from "@/lib/tenant";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { token, hasHydrated, admin, tenant, membership, organizations } =
    useAuthStore();

  useEffect(() => {
    if (hasHydrated && token) {
      if (admin && admin.role !== "super_admin" && tenant?.slug) {
        if (!isTenantHost(tenant.slug)) {
          const handoffSession: AuthSessionData = {
            token,
            admin,
            tenant,
            membership,
            organizations,
          };
          const handoffUrl = buildTenantAuthAcceptUrl(
            tenant.slug,
            "/dashboard",
            handoffSession,
          );
          window.location.replace(handoffUrl);
          return;
        }

        window.location.replace(buildTenantAppUrl(tenant.slug, "/dashboard"));
        return;
      }

      router.replace("/dashboard");
    }
  }, [
    admin,
    hasHydrated,
    membership,
    organizations,
    router,
    tenant,
    token,
  ]);

  if (!hasHydrated || token) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Checking your session...",
          "Preparing password reset...",
          "Verifying account status...",
        ]}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <ForgotPasswordForm className="w-full max-w-md" />
    </div>
  );
}
