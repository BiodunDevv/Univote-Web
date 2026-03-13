"use client";

import { useState } from "react";
import { FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { useExportDataMutation } from "@/lib/queries/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export default function ReportsPage() {
  const exportData = useExportDataMutation();
  const [format, setFormat] = useState("json");

  const reportTypes = [
    { key: "students", label: "Student registry", description: "Download active and inactive student data." },
    { key: "votes", label: "Votes", description: "Export raw vote records with session references." },
    { key: "sessions", label: "Sessions", description: "Export session definitions and ballot configuration." },
    { key: "admins", label: "Administrators", description: "Download administrator account metadata." },
    { key: "audit_logs", label: "Audit logs", description: "Extract operational activity for compliance review." },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <FileBarChart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Reports Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate exports from the live backend without leaving the dashboard.
            </p>
          </div>
        </div>
      </section>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Export format</CardTitle>
        </CardHeader>
        <CardContent className="max-w-xs">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {reportTypes.map((report) => (
          <Card key={report.key} className="border shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{report.label}</p>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
