"use client";

import { useState } from "react";
import { CalendarClock, ShieldCheck, Vote } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
  PortalPage,
  PortalStackCard,
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

  if (isLoading && !data) {
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
        title="Session center"
        description="Track live, upcoming, and completed sessions in one mobile-friendly space."
        className="p-4 sm:p-5"
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <PortalStackCard className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Vote className="h-4 w-4 text-primary" />
            All sessions
          </div>
          <p className="text-2xl font-semibold text-foreground">{sessions.length}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Everything currently available to your profile.
          </p>
        </PortalStackCard>
        <PortalStackCard className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Active now
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {sessions.filter((session) => session.status === "active").length}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Ready ballots you can act on immediately.
          </p>
        </PortalStackCard>
        <PortalStackCard className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" />
            Upcoming
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {sessions.filter((session) => session.status === "upcoming").length}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Sessions you can review before voting opens.
          </p>
        </PortalStackCard>
      </div>

      <Tabs value={status} onValueChange={setStatus} className="w-full">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-linear-to-l from-background to-transparent" />
          <TabsList
            variant="line"
            className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto border-b border-border/70 px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {statusTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="shrink-0 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 sm:px-4"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
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
            <div className="grid gap-2.5">
              {sessions.map((session) => (
                <StudentSessionCard
                  key={session._id}
                  session={session}
                  href={`/students/sessions/${session._id}`}
                  compact
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PortalPage>
  );
}
