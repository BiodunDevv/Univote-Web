import { Suspense } from "react";
import { TenantDashboardShell } from "@/components/tenants/tenant-dashboard-shell";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <ChangingLoadingState
          fullHeight
          messages={[
            "Preparing tenant workspace...",
            "Loading dashboard shell...",
          ]}
        />
      }
    >
      <TenantDashboardShell>{children}</TenantDashboardShell>
    </Suspense>
  );
}
