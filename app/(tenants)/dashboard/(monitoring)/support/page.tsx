"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminChatWidgetStore } from "@/lib/store/useAdminChatWidgetStore";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

function TenantSupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openTicket = useAdminChatWidgetStore((state) => state.openTicket);

  useEffect(() => {
    openTicket(searchParams.get("ticket"));
    router.replace("/dashboard");
  }, [openTicket, router, searchParams]);

  return (
    <ChangingLoadingState
      fullHeight
      messages={[
        "Opening support sheet...",
        "Preparing conversation inbox...",
        "Returning to dashboard...",
      ]}
    />
  );
}

export default function TenantSupportPage() {
  return (
    <Suspense fallback={null}>
      <TenantSupportPageContent />
    </Suspense>
  );
}
