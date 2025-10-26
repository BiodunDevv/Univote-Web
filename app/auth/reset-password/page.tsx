"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ResetPasswordForm } from "@/components/Auth/reset-password-form";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/lib/store/useAuthStore";

function ResetPasswordContent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <Suspense fallback={<div className="w-full max-w-md">Loading...</div>}>
        <ResetPasswordForm className="w-full max-w-md" />
      </Suspense>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    }
  }, [token, router]);

  if (token) {
    return null;
  }

  return <ResetPasswordContent />;
}
