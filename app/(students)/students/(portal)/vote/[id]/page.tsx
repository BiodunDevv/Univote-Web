"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react-liveness/styles.css";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LocateFixed,
  MapPin,
  ScanFace,
  ShieldAlert,
  Smartphone,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import { PortalPage } from "@/components/students/portal/portal-page";
import {
  fetchVoteLivenessSessionResult,
  useCreateVoteLivenessSessionMutation,
  useStudentSessionDetailQuery,
  useSubmitVoteMutation,
} from "@/lib/queries/student";
import { ApiError } from "@/lib/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type VoteStep = "ballot" | "location" | "liveness" | "review";
type LivenessStatus =
  | "idle"
  | "creating_session"
  | "ready"
  | "camera_active"
  | "processing"
  | "verifying_identity"
  | "passed"
  | "failed"
  | "locked"
  | "unsupported";

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

function extractVoteError(error: unknown) {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code || null,
      retryAfterSeconds:
        typeof error.payload?.retry_after_seconds === "number"
          ? error.payload.retry_after_seconds
          : null,
      lockedUntil:
        typeof error.payload?.locked_until === "string"
          ? error.payload.locked_until
          : null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: null,
      retryAfterSeconds: null,
      lockedUntil: null,
    };
  }

  return {
    message: "We could not submit your vote. Please try again.",
    code: null,
    retryAfterSeconds: null,
    lockedUntil: null,
  };
}

function getVoteErrorMessage(error: unknown) {
  const details = extractVoteError(error);

  switch (details.code) {
    case "ALREADY_VOTED":
      return "Your vote has already been recorded for this session.";
    case "MOBILE_DEVICE_REQUIRED":
      return "This ballot can only be completed from a mobile device. Open the student app on your phone and try again.";
    case "NO_REGISTERED_FACE":
      return "Your biometric profile is not enrolled or needs to be refreshed. Please contact your university administrator.";
    case "GEOFENCE_VIOLATION":
      return "You are outside the approved voting radius for this session. Move into the allowed area and try again.";
    case "LIVENESS_REQUIRED":
      return "Complete the live presence check before submitting your vote.";
    case "LIVENESS_FAILED":
      return "Your live check completed, but the confidence score was below the current verification threshold. Move into better lighting, keep your face centered, and try again.";
    case "LIVENESS_SESSION_EXPIRED":
      return "Your liveness session expired. Start a new live check and submit again.";
    case "LIVENESS_INCOMPLETE":
      return "Your liveness session has not completed yet. Finish the live check and retry.";
    case "LOW_CONFIDENCE":
      return "Your live capture did not match the enrolled student profile strongly enough. Move into better lighting and try again.";
    case "BIOMETRIC_LOCKED":
      return details.retryAfterSeconds
        ? `Biometric verification is locked after repeated failed attempts. Try again in ${Math.ceil(details.retryAfterSeconds / 60)} minutes.`
        : "Biometric verification is temporarily locked after repeated failed attempts.";
    default:
      return details.message;
  }
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function StudentVotePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSessionDetailQuery(sessionId);
  const submitVote = useSubmitVoteMutation();
  const createLivenessSession = useCreateVoteLivenessSessionMutation();
  const isMobile = useIsMobile();

  const [selectedByCategory, setSelectedByCategory] = useState<
    Record<string, string>
  >({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState<VoteStep>("ballot");
  const [isLocating, setIsLocating] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>(
    hasAwsLivenessWebConfig ? "idle" : "unsupported",
  );
  const [livenessError, setLivenessError] = useState("");
  const [livenessSessionId, setLivenessSessionId] = useState("");
  const [livenessRegion, setLivenessRegion] = useState(awsGuestRegion);
  const [livenessConfidence, setLivenessConfidence] = useState<number | null>(null);
  const [livenessThreshold, setLivenessThreshold] = useState<number | null>(null);
  const [ownershipVerified, setOwnershipVerified] = useState<boolean | null>(null);
  const [compareConfidence, setCompareConfidence] = useState<number | null>(null);
  const [compareThreshold, setCompareThreshold] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const session = data?.session;

  const categories = useMemo(
    () => Object.entries(session?.candidates_by_position || {}),
    [session?.candidates_by_position],
  );

  const stepOrder: VoteStep[] = ["ballot", "location", "liveness", "review"];
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;
  const allCategoriesSelected =
    categories.length > 0 &&
    categories.every(([position]) => Boolean(selectedByCategory[position]));
  const canContinueFromLocation = Boolean(location);
  const canContinueFromLiveness =
    livenessStatus === "passed" && Boolean(livenessSessionId);
  const biometricLocked = lockoutSeconds > 0;

  useEffect(() => {
    if (!lockoutSeconds) return undefined;

    const timer = window.setInterval(() => {
      setLockoutSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setLockedUntil(null);
          setLivenessStatus("idle");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockoutSeconds]);

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading ballot...",
          "Checking session controls...",
          "Preparing secure voting flow...",
        ]}
      />
    );
  }

  if (!session || error) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {(error as Error | undefined)?.message || "Ballot could not be loaded."}
        </CardContent>
      </Card>
    );
  }

  if (!isMobile) {
    return (
      <Card className="border shadow-none">
        <CardContent className="space-y-3 p-6">
          <Badge variant="outline">Mobile required</Badge>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              Open this ballot on your mobile device
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Univote uses live camera verification and location capture during
              voting, so this ballot must be completed from a phone.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.replace("/students/vote")}>
            Back to vote center
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!session.eligible || session.status !== "active" || session.has_voted) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          {!session.eligible
            ? session.eligibility_reason || "You are not eligible for this session."
            : session.has_voted
              ? "Your vote has already been recorded for this session."
              : "This session is not currently accepting votes."}
        </AlertDescription>
      </Alert>
    );
  }

  const goToStep = (step: VoteStep) => {
    if (step === "location" && !allCategoriesSelected) return;
    if (step === "liveness" && !canContinueFromLocation) return;
    if (step === "review" && !canContinueFromLiveness) return;
    setCurrentStep(step);
  };

  const startLivenessCheck = async () => {
    if (biometricLocked) {
      setLivenessStatus("locked");
      return;
    }

    if (!hasAwsLivenessWebConfig) {
      setLivenessStatus("unsupported");
      setLivenessError(
        "AWS web liveness is not configured yet. Add a Cognito Identity Pool to enable secure live verification.",
      );
      return;
    }

    setLivenessError("");
    setLivenessConfidence(null);
    setLivenessThreshold(null);
    setOwnershipVerified(null);
    setCompareConfidence(null);
    setCompareThreshold(null);
    setLivenessStatus("creating_session");

    try {
      const nextSession = await createLivenessSession.mutateAsync();
      setLivenessSessionId(nextSession.session_id);
      setLivenessRegion(nextSession.region || awsGuestRegion);
      setLivenessStatus("ready");
    } catch (sessionError) {
      setLivenessStatus("failed");
      setLivenessError(getVoteErrorMessage(sessionError));
    }
  };

  const pollLivenessResult = async (sessionIdToCheck: string) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await fetchVoteLivenessSessionResult(sessionIdToCheck);

      if (result.status === "SUCCEEDED" || result.passed) {
        setLivenessConfidence(result.confidence ?? null);
        setLivenessThreshold(result.threshold ?? null);
        setOwnershipVerified(result.ownership_verified ?? null);
        setCompareConfidence(result.compare_confidence ?? null);
        setCompareThreshold(result.compare_threshold ?? null);
        const isVerified =
          result.passed === true && result.ownership_verified !== false;
        setLivenessStatus(isVerified ? "passed" : "failed");
        setLivenessError(
          isVerified
            ? ""
            : result.passed !== true
              ? "Your live check completed, but the confidence score was below the verification threshold. Please start a new check with brighter lighting and your face fully in frame before submitting."
              : result.ownership_verified === false
                ? result.message ||
                  "The person who completed this live check is not the owner of this account."
                : result.message ||
                  "We could not complete account ownership confirmation. Please try the live check again.",
        );
        return result;
      }

      if (result.status === "FAILED" || result.status === "EXPIRED") {
        setLivenessStatus("failed");
        setLivenessConfidence(result.confidence ?? null);
        setLivenessThreshold(result.threshold ?? null);
        setLivenessError(
          result.status === "EXPIRED"
            ? "Your liveness session expired. Start a new live check."
            : "We could not confirm a strong enough live presence on that attempt. Start a fresh check, hold steady, and try again.",
        );
        return result;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 1500);
      });
    }

    throw new Error(
      "AWS liveness verification is still processing. Please retry in a moment.",
    );
  };

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        toast.success(
          session.is_off_campus_allowed
            ? "Location captured successfully."
            : "Location captured. You can continue to secure verification.",
        );
      },
      (locationError) => {
        toast.error(locationError.message || "Failed to capture location");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmitVote = async () => {
    if (
      !allCategoriesSelected ||
      !location ||
      livenessStatus !== "passed" ||
      ownershipVerified === false
    ) {
      toast.error(
        "Complete ballot selection, location capture, and live verification before submitting.",
      );
      return;
    }

    try {
      await submitVote.mutateAsync({
        sessionId,
        choices: categories.map(([position]) => ({
          category: position,
          candidate_id: selectedByCategory[position],
        })),
        location,
        livenessSessionId,
        deviceId:
          typeof navigator !== "undefined"
            ? navigator.userAgent
            : "mobile-client",
      });

      toast.success("Vote submitted successfully.");
      router.replace(`/students/results/${sessionId}?fromVote=1`);
    } catch (submitError) {
      const details = extractVoteError(submitError);
      if (details.code === "BIOMETRIC_LOCKED") {
        setLockoutSeconds(details.retryAfterSeconds || 5 * 60);
        setLockedUntil(details.lockedUntil);
        setLivenessStatus("locked");
      } else {
        setLivenessStatus("failed");
      }
      setLivenessError(getVoteErrorMessage(submitError));
      toast.error(getVoteErrorMessage(submitError));
    }
  };

  return (
    <PortalPage className="flex min-h-full flex-col gap-4 pb-28">
      <section className="rounded-3xl border bg-linear-to-br from-card via-card to-muted/30 p-5 shadow-none sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline">Active ballot</Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {session.title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Complete your ballot, capture your location, pass the live
                presence check, and submit securely. Univote uses your live
                reference image from AWS liveness to verify you against your
                enrolled student face automatically.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {session.status}
            </Badge>
            <Badge variant="outline">
              {session.is_off_campus_allowed
                ? "Flexible location"
                : "Geofence required"}
            </Badge>
            <Badge variant="outline">Liveness-first verification</Badge>
          </div>
        </div>
      </section>

      <Card className="border shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Voting progress
              </p>
              <p className="mt-1 text-sm text-foreground">
                Step {currentStepIndex + 1} of {stepOrder.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["ballot", "Ballot"],
                ["location", "Location"],
                ["liveness", "Liveness"],
                ["review", "Review"],
              ].map(([value, label], index) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => goToStep(value as VoteStep)}
                  className="disabled:pointer-events-none"
                  disabled={
                    (value === "location" && !allCategoriesSelected) ||
                    (value === "liveness" && !canContinueFromLocation) ||
                    (value === "review" && !canContinueFromLiveness)
                  }
                >
                  <Badge
                    variant={currentStep === value ? "default" : "outline"}
                    className="rounded-full px-3 py-1"
                  >
                    {index + 1}. {label}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {currentStep === "ballot" ? (
        <div className="grid gap-4">
          {categories.map(([position, candidates]) => (
            <Card key={position} className="border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{position}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {candidates.map((candidate) => {
                  const selected = selectedByCategory[position] === candidate.id;

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() =>
                        setSelectedByCategory((current) => ({
                          ...current,
                          [position]: candidate.id,
                        }))
                      }
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-muted/20 text-foreground hover:border-foreground/40",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-background/70">
                          {candidate.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={candidate.photo_url}
                              alt={candidate.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">{candidate.name}</p>
                            {selected ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
                          </div>
                          <p className="mt-1 text-xs opacity-80">
                            {candidate.bio || "No biography provided."}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {currentStep === "location" ? (
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Confirm your voting location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border bg-muted/20 p-5">
                <div className="flex items-start gap-3">
                  <LocateFixed className="mt-0.5 h-5 w-5 text-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Capture your live location before verification
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {session.is_off_campus_allowed
                        ? "This session allows flexible voting locations, but your location is still recorded as part of the secure audit trail."
                        : "Your device must be inside the approved voting radius for this ballot before your vote can be accepted."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-background p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {location ? "Location captured" : "Waiting for location"}
                    </p>
                  </div>
                  {location ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </span>
                    </div>
                  ) : null}
                  <Button type="button" variant="outline" onClick={captureLocation} disabled={isLocating}>
                    <LocateFixed className="mr-2 h-4 w-4" />
                    {isLocating ? "Capturing..." : "Use current location"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === "liveness" ? (
        <div className="grid gap-4">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Professional live verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {biometricLocked ? (
                <Alert variant="destructive">
                  <Clock3 className="h-4 w-4" />
                  <AlertTitle>Verification temporarily locked</AlertTitle>
                  <AlertDescription>
                    Try again in {formatCountdown(lockoutSeconds)}
                    {lockedUntil ? `, at ${new Date(lockedUntil).toLocaleTimeString()}.` : "."}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-3xl border bg-muted/20 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <Badge variant="outline">AWS liveness</Badge>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">
                          Verify your live presence with the front camera
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          The reference image captured during this live session is
                          what Univote uses to compare against your enrolled face.
                          No pre-uploaded selfie is required.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={createLivenessSession.isPending || biometricLocked}
                      onClick={() => void startLivenessCheck()}
                    >
                      <ScanFace className="mr-2 h-4 w-4" />
                      {createLivenessSession.isPending
                        ? "Preparing..."
                        : livenessStatus === "passed"
                          ? "Run again"
                          : "Start live check"}
                    </Button>
                  </div>

                  {livenessStatus === "ready" && livenessSessionId ? (
                    <div className="mt-5 overflow-hidden rounded-3xl border bg-background">
                      <FaceLivenessDetector
                        sessionId={livenessSessionId}
                        region={livenessRegion}
                        onUserCancel={() => {
                          setLivenessStatus("failed");
                          setLivenessError("Live verification was cancelled. Start again when you are ready.");
                        }}
                        onAnalysisComplete={async () => {
                          setLivenessStatus("processing");
                          setLivenessError(
                            "Live presence captured. We are now confirming that the person in the camera is the owner of this student account.",
                          );
                          await pollLivenessResult(livenessSessionId)
                            .then((result) => {
                              if (result.passed && result.ownership_verified !== false) {
                                toast.success(
                                  "Live verification passed and account ownership was confirmed.",
                                );
                              } else {
                                toast.error(
                                  result.ownership_verified === false
                                    ? "The person in the live check is not the owner of this account."
                                    : "Live verification did not pass. Start a new check.",
                                );
                              }
                            })
                            .catch((pollError: unknown) => {
                              setLivenessStatus("failed");
                              setLivenessError(getVoteErrorMessage(pollError));
                              toast.error(getVoteErrorMessage(pollError));
                            });
                        }}
                        onError={(livenessUiError: unknown) => {
                          setLivenessStatus("failed");
                          setLivenessError(getVoteErrorMessage(livenessUiError));
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border bg-background p-5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Verification state
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {livenessStatus === "idle"
                          ? "Ready to begin"
                          : livenessStatus === "creating_session"
                            ? "Creating secure session"
                            : livenessStatus === "ready"
                              ? "Camera check ready"
                              : livenessStatus === "camera_active"
                                ? "Camera active"
                                : livenessStatus === "processing"
                                  ? "Checking liveness and account ownership"
                                  : livenessStatus === "verifying_identity"
                                    ? "Confirming account ownership"
                                  : livenessStatus === "passed"
                                    ? "Live verification and ownership confirmed"
                                    : livenessStatus === "locked"
                                      ? "Locked"
                                      : livenessStatus === "unsupported"
                                        ? "Not configured"
                                        : "Verification failed"}
                      </p>
                    </div>
                    <div className="space-y-2 rounded-2xl border bg-muted/15 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Session ID</span>
                        <span className="max-w-[60%] truncate font-medium text-foreground">
                          {livenessSessionId || "Not started"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Region</span>
                        <span className="font-medium text-foreground">{livenessRegion}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium text-foreground">
                          {typeof livenessConfidence === "number"
                            ? `${livenessConfidence.toFixed(1)}%`
                            : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Threshold</span>
                        <span className="font-medium text-foreground">
                          {typeof livenessThreshold === "number"
                            ? `${livenessThreshold.toFixed(1)}%`
                            : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Account owner</span>
                        <span className="font-medium text-foreground">
                          {ownershipVerified === null
                            ? "Pending"
                            : ownershipVerified
                              ? "Confirmed"
                              : "Not confirmed"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Match confidence</span>
                        <span className="font-medium text-foreground">
                          {typeof compareConfidence === "number"
                            ? `${compareConfidence.toFixed(1)}%`
                            : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Match threshold</span>
                        <span className="font-medium text-foreground">
                          {typeof compareThreshold === "number"
                            ? `${compareThreshold.toFixed(1)}%`
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                    {livenessError ? (
                      <Alert
                        variant={
                          livenessStatus === "processing" ? "default" : "destructive"
                        }
                      >
                        <AlertTitle>
                          {livenessStatus === "processing"
                            ? "Verification in progress"
                            : ownershipVerified === false
                            ? "Account ownership not confirmed"
                            : "Verification needs attention"}
                        </AlertTitle>
                        <AlertDescription>{livenessError}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {currentStep === "review" ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Final review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border bg-muted/20 p-5">
                <div className="flex items-start gap-3">
                  <Vote className="mt-0.5 h-5 w-5 text-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Ballot selections ready
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {categories.map(([position, candidates]) => {
                        const selectedCandidate = candidates.find(
                          (candidate) => candidate.id === selectedByCategory[position],
                        );

                        return (
                          <div key={position} className="flex items-center justify-between gap-3">
                            <span>{position}</span>
                            <span className="font-medium text-foreground">
                              {selectedCandidate?.name || "Not selected"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Location ready
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {location
                        ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                        : "Location missing"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-5">
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 h-5 w-5 text-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Liveness passed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {typeof livenessConfidence === "number"
                        ? `Live confidence ${livenessConfidence.toFixed(1)}% against a ${livenessThreshold?.toFixed(1) || "pending"}% threshold.`
                        : "Awaiting confidence details."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ownershipVerified === null
                        ? "Account ownership confirmation is still pending."
                        : ownershipVerified
                          ? `Ownership confirmed with a ${compareConfidence?.toFixed(1) || "pending"}% face match score against a ${compareThreshold?.toFixed(1) || "pending"}% threshold.`
                          : "The person who completed the live check is not the owner of this account."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Submit securely</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {biometricLocked ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Submission is locked for {formatCountdown(lockoutSeconds)} because of repeated failed biometric attempts.
                  </AlertDescription>
                </Alert>
              ) : null}
              <p className="text-sm leading-6 text-muted-foreground">
                When you submit, Univote will use this completed liveness session
                as the biometric source for final vote verification. Live
                presence and account ownership have already been checked before
                this final step.
              </p>
              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={submitVote.isPending || biometricLocked}
                onClick={() => void handleSubmitVote()}
              >
                {submitVote.isPending ? (
                  <LoadingButtonContent label="Submitting secure vote..." />
                ) : (
                  "Submit vote"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="sticky bottom-4 z-20 mt-auto flex justify-between gap-3 rounded-3xl border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button
          type="button"
          variant="outline"
          disabled={currentStep === "ballot"}
          onClick={() =>
            setCurrentStep(stepOrder[Math.max(currentStepIndex - 1, 0)])
          }
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {currentStep !== "review" ? (
          <Button
            type="button"
            disabled={
              (currentStep === "ballot" && !allCategoriesSelected) ||
              (currentStep === "location" && !canContinueFromLocation) ||
              (currentStep === "liveness" && !canContinueFromLiveness)
            }
            onClick={() =>
              setCurrentStep(
                stepOrder[Math.min(currentStepIndex + 1, stepOrder.length - 1)],
              )
            }
          >
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={submitVote.isPending || biometricLocked}
            onClick={() => void handleSubmitVote()}
          >
            {submitVote.isPending ? "Submitting..." : "Submit vote"}
          </Button>
        )}
      </div>
    </PortalPage>
  );
}
