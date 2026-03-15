"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ResetPasswordForm } from "@/components/Auth/reset-password-form";
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

function ResetPasswordContent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <ChangingLoadingState
            className="w-full max-w-md"
            messages={["Loading reset form...", "Validating reset token..."]}
          />
        }
      >
        <ResetPasswordForm className="w-full max-w-md" />
      </Suspense>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          "Validating reset token...",
          "Preparing password reset...",
        ]}
      />
    );
  }

  return <ResetPasswordContent />;
}
