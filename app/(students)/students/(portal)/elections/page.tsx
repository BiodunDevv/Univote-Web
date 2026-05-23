"use client";

import { useState } from "react";
import { Vote } from "lucide-react";
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
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

export default function StudentElectionsPage() {
  const [status, setStatus] = useState("all");
  const { data, isLoading, error } = useStudentSessionsQuery(
    status === "all" ? {} : { status },
  );

  if (isLoading && !data) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your elections...",
          "Filtering by eligibility...",
          "Preparing election cards...",
        ]}
      />
    );
  }

  const sessions = data?.sessions || [];

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Elections"
        title="Your elections"
        description="Browse and act on live, upcoming, and completed elections scoped to your profile."
      />

      <Tabs value={status} onValueChange={setStatus} className="animate-slide-up-1 w-full">
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
                className="shrink-0 px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
              >
                {tab.label}
                {tab.value !== "all" && data ? (
                  <span className="ml-1.5 tabular-nums text-muted-foreground">
                    {tab.value === "active"
                      ? data.sessions.filter((s) => s.status === "active").length
                      : tab.value === "upcoming"
                        ? data.sessions.filter((s) => s.status === "upcoming").length
                        : data.sessions.filter((s) => s.status === "ended").length}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={status} className="mt-4">
          {error ? (
            <PortalEmptyState
              icon={Vote}
              title="Elections unavailable"
              description={(error as Error).message}
            />
          ) : sessions.length === 0 ? (
            <PortalEmptyState
              icon={Vote}
              title="No elections found"
              description={
                status === "all"
                  ? "There are no elections available for your profile right now."
                  : `No ${status} elections at the moment.`
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((session) => (
                <StudentSessionCard
                  key={session._id}
                  session={session}
                  href={
                    session.has_voted
                      ? `/students/vote/${session._id}/submitted`
                      : `/students/elections/${session._id}`
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PortalPage>
  );
}
