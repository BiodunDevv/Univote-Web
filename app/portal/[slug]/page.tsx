"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PortalOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug || "");

  useEffect(() => {
    if (!slug) {
      router.replace("/students/login");
      return;
    }

    router.replace(`/students/login?organization=${encodeURIComponent(slug)}`);
  }, [router, slug]);

  return null;
}
