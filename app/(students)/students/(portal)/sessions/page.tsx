"use client";

import { useState } from "react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { StudentSessionCard } from "@/components/students-portal/session-card";
import { useStudentSessionsQuery } from "@/lib/queries/student";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sessions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review every voting session that matches your profile and permissions.
        </p>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-4">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={status} className="mt-4">
          {error ? (
            <Card className="border shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">
                {(error as Error).message}
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card className="border shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No sessions matched this filter.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
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
    </div>
  );
}
