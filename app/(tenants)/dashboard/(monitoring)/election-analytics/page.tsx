"use client";

import { useState } from "react";
import { PieChart } from "lucide-react";
import {
  useAdminAdvancedSessionAnalyticsQuery,
  useAdminBillingSummaryQuery,
  useAdminSessionsQuery,
} from "@/lib/queries/admin";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { PlanFeatureGate } from "@/components/tenants/billing/plan-feature-gate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getTenantParticipantLabels } from "@/lib/tenant-config";

export default function ElectionAnalyticsPage() {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const billingQuery = useAdminBillingSummaryQuery();
  const sessionsQuery = useAdminSessionsQuery({ page: 1, limit: 50 });
  const [manualSelectedSessionId, setManualSelectedSessionId] = useState("");
  const sessions = sessionsQuery.data?.sessions || [];
  const selectedSessionId = manualSelectedSessionId || sessions[0]?._id || "";
  const advancedAnalyticsEnabled =
    billingQuery.data?.capabilities.features.advanced_analytics ?? false;

  const sessionStatsQuery = useAdminAdvancedSessionAnalyticsQuery(
    selectedSessionId,
    {
      enabled:
        !billingQuery.isLoading &&
        advancedAnalyticsEnabled &&
        Boolean(selectedSessionId),
    },
  );

  if (
    billingQuery.isLoading ||
    sessionsQuery.isLoading ||
    (selectedSessionId && sessionStatsQuery.isLoading)
  ) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading election analytics...",
          "Fetching session statistics...",
          "Preparing candidate breakdowns...",
        ]}
      />
    );
  }

  if (!billingQuery.data?.capabilities.features.advanced_analytics) {
    return (
      <PlanFeatureGate
        title="Election Analytics"
        description="Inspect turnout, candidate performance, and rejection patterns for individual sessions."
        featureLabel="Advanced analytics"
        requiredPlanLabel="Pro Plus"
      />
    );
  }
  const stats = sessionStatsQuery.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-muted p-3">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">
              Election Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a session to inspect turnout, candidate performance, and
              rejection patterns.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.map((session) => (
              <button
                key={session._id}
                type="button"
                onClick={() => setManualSelectedSessionId(session._id)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  selectedSessionId === session._id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted/20 text-foreground hover:border-foreground/40"
                }`}
              >
                <p className="font-semibold">{session.title}</p>
                <p className="mt-1 text-sm opacity-80">{session.status}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {stats ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: `Eligible ${participantLabels.plural.toLowerCase()}`,
                    value: stats.stats.eligible_students,
                  },
                  { label: "Valid votes", value: stats.stats.total_votes },
                  { label: "Duplicate attempts", value: stats.stats.duplicate_attempts },
                  { label: "Rejected votes", value: stats.stats.rejected_votes },
                ].map((item) => (
                  <Card key={item.label} className="border shadow-none">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Candidate snapshot</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {stats.candidates.map((candidate) => (
                    <div key={candidate._id} className="rounded-2xl border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {candidate.name}
                        </p>
                        <Badge variant="outline">{candidate.vote_count} votes</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.position}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Select a session to inspect its analytics.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
