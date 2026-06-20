"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
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
          id="admin-reset-dot-pattern"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#admin-reset-dot-pattern)" />
    </svg>
  );
}

function ResetPasswordContent() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <DotGrid />
      <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/forgot-password">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to recovery
          </Link>
        </Button>
        <AnimatedThemeToggler variant="header" />
      </div>
      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <Suspense
            fallback={
              <ChangingLoadingState
                className="w-full max-w-md"
                messages={["Loading reset form...", "Validating reset token..."]}
              />
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token, hasHydrated, admin, tenant, membership } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && token) {
      if (admin && admin.role !== "super_admin" && tenant?.slug) {
        if (!isTenantHost(tenant.slug)) {
          const handoffSession: AuthSessionData = {
            token,
            admin,
            tenant,
            membership,
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
