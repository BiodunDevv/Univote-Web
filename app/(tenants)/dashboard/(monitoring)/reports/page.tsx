"use client";

import { useState } from "react";
import { FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { useAdminBillingSummaryQuery, useExportDataMutation } from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { PlanFeatureGate } from "@/components/tenants/billing/plan-feature-gate";
import {
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export default function ReportsPage() {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const billingQuery = useAdminBillingSummaryQuery();
  const exportData = useExportDataMutation();
  const [format, setFormat] = useState("json");

  const reportTypes = [
    {
      key: "students",
      label: `${participantLabels.singular} registry`,
      description: `Download active and inactive ${participantLabels.singular.toLowerCase()} data.`,
    },
    { key: "votes", label: "Votes", description: "Export raw vote records with session references." },
    { key: "sessions", label: "Sessions", description: "Export session definitions and ballot configuration." },
    { key: "admins", label: "Administrators", description: "Download administrator account metadata." },
    { key: "audit_logs", label: "Audit logs", description: "Extract operational activity for compliance review." },
  ];

  if (billingQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading reporting workspace...",
          "Checking plan entitlements...",
        ]}
      />
    );
  }

  if (!billingQuery.data?.capabilities.features.advanced_reports) {
    return (
      <PlanFeatureGate
        title="Reports"
        description="Operational and compliance-ready exports across participants, votes, sessions, and audit activity."
        featureLabel="Advanced reports"
        requiredPlanLabel="Pro Plus"
      />
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-3 p-2">
      <TenantPageHeader
        eyebrow="Tenant reporting"
        icon={<FileBarChart className="h-5 w-5" />}
        title="Reports Center"
        subtitle="Generate operational exports from live tenant data with format control and a cleaner compliance-ready workflow."
        stats={[
          {
            label: "Export sets",
            value: reportTypes.length.toLocaleString(),
          },
          {
            label: "Format",
            value: format.toUpperCase(),
          },
          {
            label: "Compliance ready",
            value: "Auditable",
          },
          {
            label: "Delivery",
            value: "Direct download",
          },
        ]}
      />

      <TenantSectionCard
        title="Export preferences"
        description="Choose the format once, then run each report against the current tenant snapshot."
      >
        <div className="max-w-xs">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TenantSectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {reportTypes.map((report) => (
          <TenantSectionCard
            key={report.key}
            title={report.label}
            description={report.description}
            action={
              <Button
                disabled={exportData.isPending}
                onClick={async () => {
                  const blob = await exportData.mutateAsync({
                    dataType: report.key,
                    format,
                  });
                  downloadBlob(
                    blob,
                    `${report.key.replace("_", "-")}-${new Date().toISOString()}.${format}`,
                  );
                  toast.success(`${report.label} exported`);
                }}
              >
                {exportData.isPending ? "Exporting..." : "Export"}
              </Button>
            }
          >
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              The export is generated directly from the current tenant dataset and downloaded
              locally once the backend stream is ready.
            </div>
          </TenantSectionCard>
        ))}
      </div>
    </div>
  );
}
