"use client";

import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TenantPageHeader } from "./page-header";

export function TenantAccessRestricted({
  title = "Access restricted",
  subtitle,
  detail,
}: {
  title?: string;
  subtitle?: string;
  detail?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
      <TenantPageHeader
        eyebrow="Tenant access"
        icon={<Lock className="h-5 w-5" />}
        title={title}
        subtitle={
          subtitle ||
          "Your university role does not allow access to this workspace area."
        }
      />
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {detail ||
            "Contact the university owner or an administrator with tenant management access if you need this page enabled for your role."}
        </CardContent>
      </Card>
    </div>
  );
}
