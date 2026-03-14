"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function CollegeStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  useEffect(() => {
    if (!collegeId) return;

    const ref = `/dashboard/structure/colleges/${collegeId}`;
    router.replace(
      `/dashboard/students?college_id=${encodeURIComponent(collegeId)}&ref=${encodeURIComponent(ref)}`,
    );
  }, [collegeId, router]);

  return (
    <ChangingLoadingState
      fullHeight
      messages={[
        "Redirecting to student registry...",
        "Applying college filter...",
      ]}
    />
  );
}
