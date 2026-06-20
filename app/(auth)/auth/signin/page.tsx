"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/Auth/signin-form";
import { type AuthSessionData, useAuthStore } from "@/lib/store/useAuthStore";
import {
  buildTenantAppUrl,
  buildTenantAuthAcceptUrl,
  buildPublicAppUrl,
  clearTenantSlugOverride,
  deriveTenantSlugFromHostname,
  isTenantHost,
} from "@/lib/tenant";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { AuthPageShell } from "@/components/Auth/auth-page-shell";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    token,
    hasHydrated,
    admin,
    tenant,
    membership,
  } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !token && !deriveTenantSlugFromHostname()) {
      clearTenantSlugOverride();
    }
  }, [hasHydrated, token]);

  useEffect(() => {
    if (hasHydrated && token) {
      if (!admin) {
        return;
      }

      const ref = searchParams.get("ref");
      const redirectTarget =
        ref && ref.startsWith("/")
          ? ref
          : admin.role === "super_admin"
            ? "/super-admin"
            : "/dashboard";

      if (admin.role === "super_admin") {
        window.location.replace(buildPublicAppUrl(redirectTarget));
        return;
      }

      const tenantSlug = tenant?.slug;
      if (tenantSlug) {
        const tenantTarget = redirectTarget.startsWith("/dashboard")
          ? redirectTarget
          : "/dashboard";

        if (!isTenantHost(tenantSlug)) {
          const handoffSession: AuthSessionData = {
            token,
            admin,
            tenant,
            membership,
          };
          const handoffUrl = buildTenantAuthAcceptUrl(
            tenantSlug,
            tenantTarget,
            handoffSession,
          );
          window.location.replace(handoffUrl);
          return;
        }

        window.location.replace(buildTenantAppUrl(tenantSlug, tenantTarget));
        return;
      }

      router.replace(redirectTarget);
    }
  }, [
    admin,
    hasHydrated,
    membership,
    router,
    searchParams,
    tenant,
    token,
  ]);

  if (!hasHydrated || token) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Checking your session...",
          "Verifying credentials...",
          "Preparing sign-in...",
        ]}
      />
    );
  }

  return (
    <AuthPageShell backHref="/" backLabel="Back to website">
      <LoginForm />
    </AuthPageShell>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <ChangingLoadingState
          fullHeight
          messages={[
            "Checking your session...",
            "Verifying credentials...",
            "Preparing sign-in...",
          ]}
        />
      }
    >
      <SignInPageContent />
    </Suspense>
  );
}
