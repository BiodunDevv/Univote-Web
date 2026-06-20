"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import Link from "next/link";
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
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function DotGrid() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035] dark:opacity-[0.055]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="admin-auth-dot-pattern"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#admin-auth-dot-pattern)" />
    </svg>
  );
}

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
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <DotGrid />
      <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to website
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" />
      </div>
      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
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
