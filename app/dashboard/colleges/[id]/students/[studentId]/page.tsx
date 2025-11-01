"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  GraduationCap,
  Building2,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  Edit,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStudentStore } from "@/lib/store/useStudentStore";

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const studentId = params.studentId as string;

  const { token, admin } = useAuthStore();
  const { currentStudent, votingHistory, loading, error, fetchStudentById } =
    useStudentStore();

  const isSuperAdmin = admin?.role === "super_admin";

  useEffect(() => {
    if (studentId) {
      fetchStudentById(token || undefined, studentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !currentStudent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !currentStudent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border shadow-none text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {error || "Student not found"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            The student you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Button
            onClick={() =>
              router.push(`/dashboard/colleges/${collegeId}/students`)
            }
          >
            Back to Students
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  router.push(`/dashboard/colleges/${collegeId}/students`)
                }
                className="rounded-full hover:bg-accent h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Student Details
                </h1>
                <p className="text-xs text-muted-foreground">
                  View student information and voting history
                </p>
              </div>
            </div>
            {isSuperAdmin && (
              <Button
                size="sm"
                onClick={() =>
                  router.push(
                    `/dashboard/colleges/${collegeId}/students/${studentId}/edit`
                  )
                }
              >
                <Edit className="w-3.5 h-3.5 mr-2" />
                Edit Student
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-6 border shadow-none">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-4 border-border">
                {currentStudent.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentStudent.photo_url}
                    alt={currentStudent.full_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-2xl">${currentStudent.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-2xl">
                    {currentStudent.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
              </div>
              {currentStudent.has_facial_data && (
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 border-4 border-background flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {currentStudent.full_name}
                  </h2>
                  <p className="text-sm font-mono font-semibold text-primary">
                    {currentStudent.matric_no}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentStudent.is_active
                      ? "bg-green-500/10 text-green-600"
                      : "bg-gray-500/10 text-gray-600"
                  }`}
                >
                  {currentStudent.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">
                      {currentStudent.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="text-sm text-foreground">
                      {currentStudent.level}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Information */}
          <Card className="p-6 border shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Academic Information
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">College</p>
                <p className="text-sm text-foreground font-medium">
                  {currentStudent.college}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Department</p>
                <p className="text-sm text-foreground font-medium">
                  {currentStudent.department}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Department Code
                </p>
                <p className="text-sm font-mono font-semibold text-primary">
                  {currentStudent.department_code}
                </p>
              </div>
            </div>
          </Card>

          {/* Account Status */}
          <Card className="p-6 border shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Account Status
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {currentStudent.has_facial_data ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Facial Recognition
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentStudent.has_facial_data
                        ? "Registered"
                        : "Not Registered"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {currentStudent.first_login ? (
                    <XCircle className="w-5 h-5 text-orange-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      First Login
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentStudent.first_login ? "Pending" : "Completed"}
                    </p>
                  </div>
                </div>
              </div>

              {currentStudent.last_login_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Last Login
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(currentStudent.last_login_at)}
                  </p>
                  {currentStudent.last_login_device && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Device: {currentStudent.last_login_device}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Account Created
                </p>
                <p className="text-sm text-foreground">
                  {formatDate(currentStudent.createdAt)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Voting History */}
        <Card className="p-6 border shadow-none">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Voting History
            </h3>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {votingHistory.length}
            </span>
          </div>

          {votingHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No voting history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This student hasn&apos;t participated in any elections
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {votingHistory.map((vote) => (
                <div
                  key={vote._id}
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        {vote.session_id.title}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Voted: {formatDate(vote.voted_at)}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vote.status === "completed"
                          ? "bg-green-500/10 text-green-600"
                          : vote.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-gray-500/10 text-gray-600"
                      }`}
                    >
                      {vote.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>Session Period: </span>
                    <span className="font-medium">
                      {formatDate(vote.session_id.start_time)} -{" "}
                      {formatDate(vote.session_id.end_time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
