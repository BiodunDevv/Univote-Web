"use client";

import { useState } from "react";
import { FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { useExportDataMutation } from "@/lib/queries/admin";
import {
  TenantAccessRestricted,
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
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export default function ReportsPage() {
  const { tenant, membership } = useAuthStore();
  const canExportReports = hasAnyTenantPermission(membership, [
    "reports.export",
    "tenant.manage",
  ]);
  const participantLabels = getTenantParticipantLabels(tenant);
  const exportData = useExportDataMutation();
  const [format, setFormat] = useState("json");
  const [activeExportKey, setActiveExportKey] = useState<string | null>(null);

  if (!canExportReports) {
    return (
      <TenantAccessRestricted
        title="Reports access restricted"
        subtitle="Your university role does not allow data export and reporting."
      />
    );
  }

  const reportTypes = [
    {
      key: "students",
      label: `${participantLabels.singular} registry`,
      description: `Download active and inactive ${participantLabels.singular.toLowerCase()} data.`,
    },
    {
      key: "votes",
      label: "Votes",
      description: "Export raw vote records with session references.",
    },
    {
      key: "sessions",
      label: "Sessions",
      description: "Export session definitions and ballot configuration.",
    },
    {
      key: "admins",
      label: "Administrators",
      description: "Download administrator account metadata.",
    },
    {
      key: "audit_logs",
      label: "Audit logs",
      description: "Extract operational activity for compliance review.",
    },
  ];

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
                disabled={Boolean(activeExportKey)}
                onClick={async () => {
                  setActiveExportKey(report.key);
                  try {
                    const blob = await exportData.mutateAsync({
                      dataType: report.key,
                      format,
                    });
                    downloadBlob(
                      blob,
                      `${report.key.replace("_", "-")}-${new Date().toISOString()}.${format}`,
                    );
                    toast.success(`${report.label} exported`);
                  } finally {
                    setActiveExportKey(null);
                  }
                }}
              >
                {activeExportKey === report.key ? "Exporting..." : "Export"}
              </Button>
            }
          >
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              The export is generated directly from the current tenant dataset
              and downloaded locally once the backend stream is ready.
            </div>
          </TenantSectionCard>
        ))}
      </div>
    </div>
  );
}
