"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { StudentShell } from "@/components/students-portal/student-shell";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, student, hasHydrated, fetchProfile, logout } =
    useStudentAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      router.replace("/students/login");
      return;
    }

    if (student) return;

    let isMounted = true;

    void fetchProfile()
      .catch(async () => {
        await logout();
        if (isMounted) {
          router.replace("/students/login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchProfile, hasHydrated, logout, router, student, token]);

  if (!hasHydrated || !token || !student) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Verifying student session...",
          "Loading your portal...",
          "Preparing voting workspace...",
        ]}
      />
    );
  }

  return <StudentShell>{children}</StudentShell>;
}
