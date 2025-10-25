"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordForm } from "@/components/Auth/forgot-password-form";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function ForgotPasswordPage() {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <ForgotPasswordForm className="w-full max-w-md" />
    </div>
  );
}
