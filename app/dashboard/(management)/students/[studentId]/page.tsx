"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  GraduationCap,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/College";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStudentDetailQuery } from "@/lib/queries/admin";

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const backRef = searchParams.get("ref") || "/dashboard/students";

  const { token, hasHydrated, admin } = useAuthStore();
  const isAuthorized = hasHydrated && Boolean(token);
  const studentDetailQuery = useAdminStudentDetailQuery(studentId, {
    enabled: isAuthorized,
  });
  const currentStudent = studentDetailQuery.data?.student;
  const votingHistory = studentDetailQuery.data?.voting_history ?? [];
  const isSuperAdmin = admin?.role === "super_admin";

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace(`/auth/signin?ref=${encodeURIComponent(backRef)}`);
    }
  }, [backRef, hasHydrated, router, token]);

  if (!hasHydrated || studentDetailQuery.isLoading) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Loading student profile...",
          "Fetching voting history...",
          "Preparing student record...",
        ]}
      />
    );
  }

  if (studentDetailQuery.error || !currentStudent) {
    return (
      <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-none">
          <CardContent className="space-y-3 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="text-sm font-semibold">
              {studentDetailQuery.error instanceof Error
                ? studentDetailQuery.error.message
                : "Student not found"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => router.push(backRef)}>
                Back to Students
              </Button>
              <Button
                variant="outline"
                onClick={() => void studentDetailQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-2">
      <PageHeader
        title={currentStudent.full_name}
        subtitle={currentStudent.matric_no}
        onBack={() => router.push(backRef)}
        actions={
          isSuperAdmin ? (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() =>
                router.push(
                  `/dashboard/students/${studentId}/edit?ref=${encodeURIComponent(backRef)}`,
                )
              }
            >
              Edit Student
            </Button>
          ) : undefined
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2">
        <Card className="border shadow-none">
          <CardContent className="space-y-3 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="break-all">{currentStudent.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{currentStudent.college}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>
                {currentStudent.department} ({currentStudent.level})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{currentStudent.is_active ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                {currentStudent.has_facial_data
                  ? "Facial data registered"
                  : "No facial data"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold">Voting History</p>
            {votingHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No voting records found.
              </p>
            ) : (
              <div className="space-y-2">
                {votingHistory.map((vote) => (
                  <div key={vote._id} className="rounded-md border p-2 text-xs">
                    <p className="font-medium">
                      {vote.session_id?.title || "Session"}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(vote.voted_at || vote.timestamp || "").toLocaleString()} •{" "}
                      {vote.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
