"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function LegacyCollegeUploadStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  useEffect(() => {
    const ref = `/dashboard/structure/colleges/${collegeId}`;
    router.replace(
      `/dashboard/students/upload?college_id=${encodeURIComponent(collegeId)}&ref=${encodeURIComponent(ref)}`,
    );
  }, [collegeId, router]);

  return (
    <ChangingLoadingState
      fullHeight
      messages={[
        "Redirecting to unified upload...",
        "Applying college context...",
      ]}
    />
  );
}
