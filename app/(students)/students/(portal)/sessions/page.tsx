"use client";

import { useState } from "react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { StudentSessionCard } from "@/components/students/portal/session-card";
import { useStudentSessionsQuery } from "@/lib/queries/student";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusTabs = [
  { value: "all", label: "All sessions" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

export default function StudentSessionsPage() {
  const [status, setStatus] = useState("all");
  const { data, isLoading, error } = useStudentSessionsQuery(
    status === "all" ? {} : { status },
  );

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your sessions...",
          "Filtering by eligibility...",
          "Preparing session cards...",
        ]}
      />
    );
  }

  const sessions = data?.sessions || [];

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Sessions"
        title="Your session workspace"
        description="Review every voting session that matches your profile and permissions."
      />

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList
          variant="line"
          className="flex h-auto w-full flex-wrap justify-start gap-1"
        >
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl border border-border/70 px-3 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={status} className="mt-4">
          {error ? (
            <PortalEmptyState
              title="Sessions unavailable"
              description={(error as Error).message}
            />
          ) : sessions.length === 0 ? (
            <PortalEmptyState
              title="No sessions matched"
              description="No sessions matched this filter."
            />
          ) : (
            <div className="grid gap-3">
              {sessions.map((session) => (
                <StudentSessionCard
                  key={session._id}
                  session={session}
                  href={`/students/sessions/${session._id}`}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PortalPage>
  );
}
