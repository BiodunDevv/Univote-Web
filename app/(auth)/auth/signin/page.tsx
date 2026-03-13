"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/Auth/signin-form";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && token) {
      const ref = searchParams.get("ref");
      const redirectTarget = ref && ref.startsWith("/") ? ref : "/dashboard";
      router.replace(redirectTarget);
    }
  }, [token, router, hasHydrated, searchParams]);

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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
