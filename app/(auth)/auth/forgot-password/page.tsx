"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordForm } from "@/components/Auth/forgot-password-form";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function ForgotPasswordPage() {
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
