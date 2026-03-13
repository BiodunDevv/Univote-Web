"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ResetPasswordForm } from "@/components/Auth/reset-password-form";
import { useAuthStore } from "@/lib/store/useAuthStore";
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
  const { token, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && token) {
      router.replace("/dashboard");
    }
  }, [token, router, hasHydrated]);

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
