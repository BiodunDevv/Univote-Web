"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react-liveness/styles.css";
import {
  Activity,
  AlertCircle,
  Fingerprint,
  Image as ImageIcon,
  RefreshCcw,
  ScanFace,
} from "lucide-react";
import { isApiError } from "@/lib/api/client";
import {
  fetchAdminTestingLivenessSessionResult,
  useAdminStudentsQuery,
  useAdminSystemConfigQuery,
  useAdminTestingCompareMutation,
  useAdminVerificationLogsQuery,
  useCreateAdminTestingLivenessSessionMutation,
} from "@/lib/queries/admin";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import {
  TenantAccessRestricted,
  TenantEmptyState,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

const FaceLivenessDetector = dynamic(
  () =>
    import("@aws-amplify/ui-react-liveness").then(
      (mod) => mod.FaceLivenessDetector,
    ),
  { ssr: false },
);

const awsIdentityPoolId =
  process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID || "";
const awsGuestRegion = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
const hasAwsLivenessWebConfig = Boolean(awsIdentityPoolId);

if (hasAwsLivenessWebConfig) {
  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId: awsIdentityPoolId,
        allowGuestAccess: true,
      },
    },
  });
}

type LivenessState =
  | "idle"
  | "creating_session"
  | "ready"
  | "processing"
  | "passed"
  | "completed_below_threshold"
  | "failed";

export default function TenantTestingPage() {
  const { membership } = useAuthStore();
  const canRunDiagnostics = hasAnyTenantPermission(membership, [
    "analytics.view",
    "tenant.manage",
    "tenant.settings.manage",
  ]);
  const systemConfigQuery = useAdminSystemConfigQuery();
  const studentsQuery = useAdminStudentsQuery({ limit: 100, has_facial_data: true });
  const verificationLogsQuery = useAdminVerificationLogsQuery({ limit: 8 });
  const createLivenessSession = useCreateAdminTestingLivenessSessionMutation();
  const compareMutation = useAdminTestingCompareMutation();

  const [livenessState, setLivenessState] = useState<LivenessState>("idle");
  const [activeTab, setActiveTab] = useState("liveness");
  const [livenessError, setLivenessError] = useState("");
  const [livenessSessionId, setLivenessSessionId] = useState("");
  const [livenessRegion, setLivenessRegion] = useState(awsGuestRegion);
  const [livenessResult, setLivenessResult] = useState<{
    confidence: number | null;
    threshold: number | null;
    status: string | null;
    passed: boolean;
  } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [compareImageUrl, setCompareImageUrl] = useState("");
  const [comparePreviewUrl, setComparePreviewUrl] = useState("");
  const [compareUploadError, setCompareUploadError] = useState("");
  const [compareUploading, setCompareUploading] = useState(false);
  const [compareUploadProgress, setCompareUploadProgress] = useState(0);

  const config = systemConfigQuery.data?.system_config;
  const logs = verificationLogsQuery.data?.logs || [];
  const students = studentsQuery.data?.students;

  const selectedStudent = useMemo(
    () => students?.find((student) => student._id === selectedStudentId),
    [selectedStudentId, students],
  );

  const startLivenessTest = async () => {
    if (!hasAwsLivenessWebConfig) {
      setLivenessState("failed");
      setLivenessError(
        "AWS web liveness is not configured for this environment.",
      );
      return;
    }

    setLivenessError("");
    setLivenessResult(null);
    setLivenessState("creating_session");

    try {
      const session = await createLivenessSession.mutateAsync();
      setLivenessSessionId(session.session_id);
      setLivenessRegion(session.region || awsGuestRegion);
      setLivenessState("ready");
    } catch (error) {
      setLivenessState("failed");
      setLivenessError(
        error instanceof Error ? error.message : "Failed to create liveness session.",
      );
    }
  };

  const pollLivenessResult = async (sessionId: string) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await fetchAdminTestingLivenessSessionResult(sessionId);
      if (result.status === "SUCCEEDED" || result.status === "FAILED" || result.status === "EXPIRED" || result.passed) {
        setLivenessResult({
          confidence: result.confidence,
          threshold: result.threshold,
          status: result.status,
          passed: result.passed,
        });
        setLivenessState(
          result.passed
            ? "passed"
            : result.status === "SUCCEEDED"
              ? "completed_below_threshold"
              : "failed",
        );
        setLivenessError(
          result.passed
            ? ""
            : result.status === "SUCCEEDED"
              ? "The AWS liveness session completed successfully, but the confidence score did not meet your configured threshold."
              : result.status === "EXPIRED"
                ? "The liveness session expired before it met the required threshold."
                : "The liveness session did not pass the required threshold.",
        );
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }

    throw new Error("Liveness result is still processing.");
  };

  const handleCompareUpload = async (file: File) => {
    setCompareUploading(true);
    setCompareUploadError("");
    setCompareUploadProgress(0);

    try {
      const uploaded = await uploadImageToCloudinary(
        file,
        "univote/tenant-testing",
        (progress) => setCompareUploadProgress(progress),
      );
      setCompareImageUrl(uploaded);
      setComparePreviewUrl(URL.createObjectURL(file));
    } catch (error) {
      setCompareUploadError(
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setCompareUploading(false);
      setTimeout(() => setCompareUploadProgress(0), 400);
    }
  };

  if (
    systemConfigQuery.isLoading ||
    studentsQuery.isLoading ||
    verificationLogsQuery.isLoading
  ) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading testing workspace...",
          "Checking AWS biometric readiness...",
          "Preparing diagnostic tabs...",
        ]}
      />
    );
  }

  if (!canRunDiagnostics) {
    return (
      <TenantAccessRestricted
        title="Testing workspace restricted"
        subtitle="Your university role does not allow tenant biometric diagnostics."
      />
    );
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col gap-4 p-2">
      <TenantPageHeader
        eyebrow="Tenant testing"
        icon={<ScanFace className="h-5 w-5" />}
        title="Biometric Testing Hub"
        subtitle="Run live verification tests, compare enrolled student faces, and inspect provider readiness from one full-width diagnostic workspace."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={verificationLogsQuery.isFetching}
            onClick={() => verificationLogsQuery.refetch()}
          >
            {verificationLogsQuery.isFetching ? (
              <LoadingButtonContent label="Refreshing events..." />
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh events
              </>
            )}
          </Button>
        }
        stats={[
          {
            label: "Provider",
            value: config?.biometrics.configured ? "Configured" : "Pending",
          },
          {
            label: "Region",
            value: config?.biometrics.region || "Unavailable",
          },
          {
            label: "Liveness",
            value: config?.biometrics.liveness_required === false ? "Optional" : "Required",
          },
          {
            label: "Recent events",
            value: logs.length.toString(),
          },
        ]}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
        data-tour="tenant-testing-tabs"
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-linear-to-l from-background to-transparent" />
          <TabsList
            variant="line"
            className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto border-b border-border/70 px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsTrigger
              value="liveness"
              className="shrink-0 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 sm:px-4"
            >
              Liveness Test
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="shrink-0 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 sm:px-4"
            >
              Face Compare Test
            </TabsTrigger>
            <TabsTrigger
              value="diagnostics"
              className="shrink-0 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 sm:px-4"
            >
              Diagnostics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="liveness" className="space-y-4">
          <TenantSectionCard
            title="AWS liveness session test"
            description="Create a liveness session, complete the detector, and inspect the resolved provider result."
          >
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border bg-muted/20 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Badge variant="outline">AWS liveness detector</Badge>
                    <p className="text-sm leading-6 text-muted-foreground">
                      This runs the same live camera capture path used during
                      student voting, but in an admin diagnostic workspace.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void startLivenessTest()}
                    disabled={createLivenessSession.isPending}
                  >
                    <ScanFace className="mr-2 h-4 w-4" />
                    {createLivenessSession.isPending ? "Preparing..." : "Start test"}
                  </Button>
                </div>

                {livenessState === "ready" && livenessSessionId ? (
                  <div className="mt-5 overflow-hidden rounded-3xl border bg-background">
                    <FaceLivenessDetector
                      sessionId={livenessSessionId}
                      region={livenessRegion}
                      onAnalysisComplete={async () => {
                        setLivenessState("processing");
                        await pollLivenessResult(livenessSessionId).catch((error) => {
                          setLivenessState("failed");
                          setLivenessError(
                            error instanceof Error
                              ? error.message
                              : "Failed to resolve liveness result.",
                          );
                        });
                      }}
                      onError={(error: unknown) => {
                        setLivenessState("failed");
                        setLivenessError(
                          error instanceof Error
                            ? error.message
                            : "Liveness detector failed.",
                        );
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border bg-background p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Current state
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {livenessState === "completed_below_threshold"
                        ? "completed below threshold"
                        : livenessState.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="space-y-2 rounded-2xl border bg-muted/15 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Session ID</span>
                      <span className="max-w-[60%] truncate font-medium text-foreground">
                        {livenessSessionId || "Not started"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Region</span>
                      <span className="font-medium text-foreground">{livenessRegion}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-foreground">
                        {livenessResult?.status || "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium text-foreground">
                        {typeof livenessResult?.confidence === "number"
                          ? `${livenessResult.confidence.toFixed(1)}%`
                          : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Threshold</span>
                      <span className="font-medium text-foreground">
                        {typeof livenessResult?.threshold === "number"
                          ? `${livenessResult.threshold.toFixed(1)}%`
                          : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Decision</span>
                      <span className="font-medium text-foreground">
                        {livenessResult
                          ? livenessResult.passed
                            ? "Passed"
                            : livenessResult.status === "SUCCEEDED"
                              ? "Completed below threshold"
                              : "Rejected"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                  {livenessError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{livenessError}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              </div>
            </div>
          </TenantSectionCard>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <TenantSectionCard
            title="Enrolled student face compare"
            description="Choose an enrolled student, provide a comparison image, and inspect the match decision returned by AWS."
          >
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4 rounded-3xl border bg-muted/20 p-5">
                <div className="space-y-2">
                  <Label htmlFor="compare-student">Enrolled student</Label>
                  <select
                    id="compare-student"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                  >
                    <option value="">Select a student</option>
                    {(students || []).map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.full_name} {student.matric_no ? `(${student.matric_no})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compare-image-url">Comparison image URL</Label>
                  <Input
                    id="compare-image-url"
                    placeholder="https://example.com/compare-face.jpg"
                    value={compareImageUrl}
                    onChange={(event) => {
                      setCompareImageUrl(event.target.value);
                      setComparePreviewUrl(event.target.value);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compare-image-file">Or upload a comparison image</Label>
                  <Input
                    id="compare-image-file"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleCompareUpload(file);
                      }
                    }}
                  />
                </div>

                {compareUploading ? (
                  <div className="space-y-2 rounded-2xl border bg-background/70 p-3">
                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      <span>Uploading image</span>
                      <span>{compareUploadProgress}%</span>
                    </div>
                    <Progress value={compareUploadProgress} className="h-2" />
                  </div>
                ) : null}

                {compareUploadError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{compareUploadError}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="button"
                  disabled={!selectedStudentId || !compareImageUrl || compareUploading || compareMutation.isPending}
                  onClick={() =>
                    compareMutation.mutate({
                      studentId: selectedStudentId,
                      imageUrl: compareImageUrl,
                    })
                  }
                >
                  {compareMutation.isPending ? (
                    <LoadingButtonContent label="Running compare..." />
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Run compare test
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4 rounded-3xl border bg-background p-5">
                {comparePreviewUrl ? (
                  <div className="overflow-hidden rounded-3xl border bg-muted/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={comparePreviewUrl}
                      alt="Comparison preview"
                      className="h-72 w-full object-contain"
                    />
                  </div>
                ) : (
                  <TenantEmptyState
                    icon={ImageIcon}
                    title="No comparison image yet"
                    description="Paste a public image URL or upload an image to run a face compare test."
                  />
                )}

                {selectedStudent ? (
                  <div className="rounded-2xl border bg-muted/15 p-4 text-sm">
                    <p className="font-semibold text-foreground">{selectedStudent.full_name}</p>
                    <p className="text-muted-foreground">
                      {selectedStudent.matric_no || selectedStudent.email || "Enrolled student"}
                    </p>
                  </div>
                ) : null}

                {compareMutation.data ? (
                  <div className="rounded-3xl border bg-muted/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Compare result</p>
                      <Badge variant={compareMutation.data.decision === "accepted" ? "default" : "secondary"}>
                        {compareMutation.data.decision}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-medium text-foreground">
                          {compareMutation.data.provider_label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Provider code</span>
                        <span className="font-medium text-foreground">
                          {compareMutation.data.provider_code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium text-foreground">
                          {typeof compareMutation.data.compare_confidence === "number"
                            ? `${compareMutation.data.compare_confidence.toFixed(1)}%`
                            : "Unavailable"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Threshold</span>
                        <span className="font-medium text-foreground">
                          {typeof compareMutation.data.compare_threshold === "number"
                            ? `${compareMutation.data.compare_threshold.toFixed(1)}%`
                            : "Unavailable"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Matched face ID</span>
                        <span className="max-w-[60%] truncate font-medium text-foreground">
                          {compareMutation.data.matched_face_id || "None"}
                        </span>
                      </div>
                      <div className="rounded-2xl border bg-background/80 p-3 text-muted-foreground">
                        {compareMutation.data.message}
                      </div>
                    </div>
                  </div>
                ) : null}

                {isApiError(compareMutation.error) ? (
                  <Alert variant="destructive">
                    <AlertDescription>{compareMutation.error.message}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </div>
          </TenantSectionCard>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <TenantSectionCard
              title="Provider readiness"
              description="Inspect active biometric configuration and current operating thresholds."
            >
              <div className="space-y-3">
                <div className="rounded-2xl border bg-muted/15 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Provider status</span>
                    <Badge variant={config?.biometrics.configured ? "default" : "secondary"}>
                      {config?.biometrics.configured ? "Configured" : "Not configured"}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-2xl border bg-muted/15 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Region</span>
                    <span className="font-medium text-foreground">{config?.biometrics.region || "Unavailable"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Face threshold</span>
                    <span className="font-medium text-foreground">
                      {config?.tenant?.biometric_threshold || "Unavailable"}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Liveness threshold</span>
                    <span className="font-medium text-foreground">
                      {config?.biometrics.liveness_threshold || "Unavailable"}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Liveness mode</span>
                    <span className="font-medium text-foreground">
                      {config?.biometrics.liveness_required === false ? "Optional" : "Required"}
                    </span>
                  </div>
                </div>
              </div>
            </TenantSectionCard>

            <TenantSectionCard
              title="Recent biometric events"
              description="Latest tenant-scoped biometric activity from production voting and testing paths."
            >
              <div className="space-y-3">
                {verificationLogsQuery.isFetching ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border bg-muted/15 p-4">
                      <LoadingButtonContent label="Refreshing biometric events..." />
                    </div>
                    <div className="space-y-2">
                      {[0, 1, 2].map((item) => (
                        <div
                          key={item}
                          className="h-24 animate-pulse rounded-2xl border bg-muted/10"
                        />
                      ))}
                    </div>
                  </div>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border bg-muted/15 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {log.user_id?.full_name || "Unknown student"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[
                              log.session_id?.title,
                              log.failure_reason?.replaceAll("_", " ") || log.result,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={log.result === "accepted" ? "default" : "secondary"}>
                            {log.result}
                          </Badge>
                          {log.lockout_triggered ? (
                            <Badge variant="destructive">Lockout</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span>
                          Compare:{" "}
                          {typeof log.compare_confidence === "number"
                            ? `${log.compare_confidence.toFixed(1)}%`
                            : "n/a"}
                        </span>
                        <span>
                          Liveness:{" "}
                          {typeof log.liveness_confidence === "number"
                            ? `${log.liveness_confidence.toFixed(1)}%`
                            : log.liveness_status || "n/a"}
                        </span>
                        <span>Source: {log.decision_source || "n/a"}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <TenantEmptyState
                    icon={Activity}
                    title="No biometric events yet"
                    description="Recent production and testing events will appear here automatically."
                  />
                )}
              </div>
            </TenantSectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
