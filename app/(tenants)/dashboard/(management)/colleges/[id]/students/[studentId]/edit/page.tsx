"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function LegacyCollegeStudentEditPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const studentId = params.studentId as string;

  useEffect(() => {
    const ref = `/dashboard/structure/colleges/${collegeId}`;
    router.replace(
      `/dashboard/students/${studentId}/edit?ref=${encodeURIComponent(ref)}`,
    );
  }, [collegeId, studentId, router]);

  return (
    <ChangingLoadingState
      fullHeight
      messages={[
        "Redirecting to student editor...",
        "Preparing unified workspace...",
      ]}
    />
  );
}
