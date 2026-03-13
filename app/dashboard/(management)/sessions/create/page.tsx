"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { SessionBuilder } from "@/components/sessions/editor/session-builder";
import {
  buildSessionPayload,
  createEmptySessionFormData,
} from "@/components/sessions/session-form-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminCollegesQuery,
  useCreateSessionMutation,
} from "@/lib/queries/admin";
import { SessionCreationCollege } from "@/components/sessions/create";

export default function CreateSessionPage() {
  const router = useRouter();
  const { token, hasHydrated } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const collegesQuery = useAdminCollegesQuery({}, { enabled: isAuthorized });
  const createSession = useCreateSessionMutation();

  const colleges =
    (collegesQuery.data?.colleges as SessionCreationCollege[] | undefined) ?? [];
  const initialData = useMemo(() => createEmptySessionFormData(), []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/auth/signin");
    }
  }, [hasHydrated, router, token]);

  if (!hasHydrated || collegesQuery.isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading session setup...",
          "Fetching colleges and departments...",
          "Preparing create workflow...",
        ]}
      />
    );
  }

  if (collegesQuery.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border shadow-none">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {collegesQuery.error instanceof Error
                ? collegesQuery.error.message
                : "Failed to load colleges"}
            </p>
            <Button
              variant="outline"
              onClick={() => void collegesQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SessionBuilder
      key="create-session"
      mode="create"
      title="Create Session Wizard"
      description="Build a complete voting session in guided steps with a single shared workflow."
      colleges={colleges}
      initialData={initialData}
      isSubmitting={createSession.isPending}
      onCancel={() => router.push("/dashboard/sessions")}
      onSubmit={async (formData, eligibleCollegeIds) => {
        await createSession.mutateAsync(
          buildSessionPayload(formData, eligibleCollegeIds),
        );
        router.push("/dashboard/sessions");
      }}
    />
  );
}
