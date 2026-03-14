"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlanFeatureGateProps = {
  title: string;
  description: string;
  featureLabel: string;
  requiredPlanLabel: string;
};

export function PlanFeatureGate({
  title,
  description,
  featureLabel,
  requiredPlanLabel,
}: PlanFeatureGateProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </section>

      <Card className="border shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border bg-muted p-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{featureLabel} requires a higher plan</CardTitle>
              <CardDescription>
                Upgrade to {requiredPlanLabel} or above to unlock this workspace capability.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{requiredPlanLabel} or higher</Badge>
            <Badge variant="outline">Tenant billing controlled</Badge>
          </div>
          <Button asChild>
            <Link href="/dashboard/billing">Review plans and upgrade</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
