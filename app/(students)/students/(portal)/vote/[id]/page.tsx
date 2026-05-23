"use client";

import Link from "next/link";
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
  Eye,
  LocateFixed,
  MapPin,
  Monitor,
  ScanFace,
  ShieldAlert,
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
  useStudentLocationCheckMutation,
  useStudentSessionDetailQuery,
  useSubmitVoteMutation,
} from "@/lib/queries/student";
import type { StudentLocationCheckResponse } from "@/types/student-portal";
import { ApiError } from "@/lib/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type VoteStep = "ballot" | "location" | "liveness" | "review";
type LocationCheckStatus = "idle" | "checking" | "allowed" | "denied" | "error";
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
const mapboxAccessToken =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "";
const livenessDisplayText = {
  startScreenBeginCheckText: "Begin live verification",
  photosensitivityWarningHeadingText: "Camera and light notice",
  photosensitivityWarningBodyText:
    "This check uses live camera guidance and brief brightness changes to confirm real presence before voting.",
  photosensitivityWarningInfoText:
    "Use your front camera, remove anything blocking your face, and stay in even lighting for the smoothest experience.",
  photosensitivityWarningLabelText: "Important",
  hintMoveFaceFrontOfCameraText: "Bring your full face into view.",
  hintFaceDetectedText: "Face detected. Hold steady.",
  hintCanNotIdentifyText: "We could not read your face clearly yet.",
  hintTooCloseText: "Move slightly back.",
  hintTooFarText: "Move a little closer.",
  hintConnectingText: "Connecting to AWS...",
  hintVerifyingText: "Analyzing live presence...",
  hintCheckCompleteText: "Live capture complete.",
  hintIlluminationTooBrightText: "Lighting is too bright. Reduce glare and try again.",
  hintIlluminationTooDarkText: "Lighting is too low. Move into a brighter area.",
  hintIlluminationNormalText: "Lighting looks good.",
  hintHoldFaceForFreshnessText: "Hold still while we complete the live check.",
  hintCenterFaceText: "Center your face",
  hintCenterFaceInstructionText:
    "Keep your face centered, look straight ahead, and stay at a natural arm's-length distance.",
  hintFaceOffCenterText: "Move your face back to the center.",
  hintMatchIndicatorText: "Face alignment",
  cameraMinSpecificationsHeadingText: "Camera quality is too low",
  cameraMinSpecificationsMessageText:
    "Switch to a device with a clearer front camera to complete secure verification.",
  cameraNotFoundHeadingText: "Camera access is required",
  cameraNotFoundMessageText:
    "Allow camera access for Univote and reopen the live verification step.",
  retryCameraPermissionsText: "Retry camera access",
  waitingCameraPermissionText: "Waiting for camera permission...",
  a11yVideoLabelText: "Live verification camera preview",
  recordingIndicatorText: "",
  cancelLivenessCheckText: "Cancel live check",
  connectionTimeoutHeaderText: "Connection timed out",
  connectionTimeoutMessageText:
    "Your connection dropped during live verification. Start a new check when your network is stable.",
  timeoutHeaderText: "Verification timed out",
  timeoutMessageText:
    "This live check took too long to complete. Start a new attempt and hold still.",
  faceDistanceHeaderText: "Face position needs adjustment",
  faceDistanceMessageText:
    "Keep the phone at a comfortable distance, center your face in the guide, and hold steady before retrying.",
  multipleFacesHeaderText: "Only one person can be in frame",
  multipleFacesMessageText:
    "Make sure only the account owner is visible before starting again.",
  clientHeaderText: "Device issue detected",
  clientMessageText:
    "We could not complete live verification on this device. Close other camera apps and retry.",
  serverHeaderText: "Verification service unavailable",
  serverMessageText:
    "Live verification is temporarily unavailable. Please wait a moment and try again.",
  landscapeHeaderText: "Rotate your device",
  landscapeMessageText: "Use portrait mode for secure live verification.",
  portraitMessageText: "Keep your phone upright in portrait mode.",
  tryAgainText: "Start a new check",
} as const;

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
      return "Your vote has already been recorded for this election.";
    case "MOBILE_DEVICE_REQUIRED":
      return "This ballot can only be completed from a mobile device. Open the student app on your phone and try again.";
    case "NO_REGISTERED_FACE":
      return "Your biometric profile is not enrolled or needs to be refreshed. Please contact your university administrator.";
    case "GEOFENCE_VIOLATION":
      return "You are outside the approved voting radius for this election. Move into the allowed area and try again.";
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

function formatMeters(value?: number | null) {
  if (typeof value !== "number") return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} km`;
  return `${value.toLocaleString()} m`;
}

function getLocationErrorMessage(error: GeolocationPositionError) {
  const rawMessage = error.message || "";

  if (
    rawMessage.includes("kCLErrorLocationUnknown") ||
    error.code === error.POSITION_UNAVAILABLE
  ) {
    return "Your device could not determine your location just yet. Move to an open area, ensure location services are on, and try again.";
  }

  if (error.code === error.PERMISSION_DENIED) {
    return "Location access is blocked. Allow location permission for your browser and try again.";
  }

  if (error.code === error.TIMEOUT) {
    return "Location capture timed out. Hold still for a moment and try again.";
  }

  return rawMessage || "Failed to capture location.";
}

function getLocationCheckErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "GEOFENCE_VIOLATION":
        return "You are outside the approved voting area. Move within the voting radius and capture your location again.";
      case "SESSION_INACTIVE":
        return "This election is not active right now.";
      case "ALREADY_VOTED":
        return "Your vote has already been recorded for this election.";
      case "COLLEGE_MISMATCH":
      case "DEPARTMENT_MISMATCH":
      case "LEVEL_MISMATCH":
        return "You are not eligible to vote in this election.";
      case "INVALID_COORDINATES":
        return "Your device returned invalid coordinates. Turn location services on and try again.";
      case "SESSION_NOT_FOUND":
        return "This election could not be found.";
      default:
        return error.message || "We could not verify your voting location.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not verify your voting location. Check your connection and try again.";
}

async function resolveStudentLocationName(coords: { lat: number; lng: number }) {
  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${coords.lng}&latitude=${coords.lat}&access_token=${encodeURIComponent(mapboxAccessToken)}&types=address,street,neighborhood,locality,place&language=en&limit=1`,
  );

  if (!response.ok) {
    throw new Error(`Location lookup failed with status ${response.status}`);
  }

  const result = (await response.json()) as {
    features?: Array<{
      text?: string;
      place_name?: string;
      name?: string;
      properties?: {
        name?: string;
        name_preferred?: string;
        full_address?: string;
        place_formatted?: string;
        context?: {
          place?: { name?: string };
          region?: { name?: string };
          country?: { name?: string };
        };
      };
      full_address?: string;
      place_formatted?: string;
    }>;
  };

  const primary = result.features?.[0];

  const label =
    primary?.properties?.name_preferred ||
    primary?.properties?.name ||
    primary?.properties?.full_address?.split(",")[0] ||
    primary?.name ||
    primary?.text ||
    primary?.place_formatted?.split(",")[0] ||
    primary?.full_address?.split(",")[0] ||
    primary?.place_name?.split(",")[0] ||
    "";

  const detail =
    primary?.properties?.place_formatted ||
    [
      primary?.properties?.context?.place?.name,
      primary?.properties?.context?.region?.name,
      primary?.properties?.context?.country?.name,
    ]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(", ") ||
    primary?.place_formatted
      ?.split(",")
      .map((part) => part.trim())
      .slice(0, 3)
      .join(", ") ||
    primary?.full_address
      ?.split(",")
      .map((part) => part.trim())
      .slice(0, 3)
      .join(", ") ||
    primary?.place_name
      ?.split(",")
      .map((part) => part.trim())
      .slice(0, 3)
      .join(", ") ||
    "";

  return { label, detail };
}

export default function StudentVotePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSessionDetailQuery(sessionId);
  const submitVote = useSubmitVoteMutation();
  const createLivenessSession = useCreateVoteLivenessSessionMutation();
  const locationCheckMutation = useStudentLocationCheckMutation();
  const [selectedByCategory, setSelectedByCategory] = useState<
    Record<string, string>
  >({});
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    label?: string;
    detail?: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState<VoteStep>("ballot");
  const [isLocating, setIsLocating] = useState(false);
  const [locationCheckStatus, setLocationCheckStatus] =
    useState<LocationCheckStatus>("idle");
  const [locationCheck, setLocationCheck] =
    useState<StudentLocationCheckResponse | null>(null);
  const [locationCheckMessage, setLocationCheckMessage] = useState("");
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>(
    hasAwsLivenessWebConfig ? "idle" : "unsupported",
  );
  const [livenessError, setLivenessError] = useState("");
  const [livenessSessionId, setLivenessSessionId] = useState("");
  const [livenessRegion, setLivenessRegion] = useState(awsGuestRegion);
  const [livenessConfidence, setLivenessConfidence] = useState<number | null>(null);
  const [ownershipVerified, setOwnershipVerified] = useState<boolean | null>(null);
  const [compareConfidence, setCompareConfidence] = useState<number | null>(null);
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
  const canContinueFromLocation =
    Boolean(location) && locationCheckStatus === "allowed" && locationCheck?.allowed === true;
  const canContinueFromLiveness =
    livenessStatus === "passed" &&
    ownershipVerified === true &&
    Boolean(livenessSessionId);
  const biometricLocked = lockoutSeconds > 0;
  const reviewSelections = categories.map(([position, candidates]) => ({
    position,
    candidate:
      candidates.find((candidate) => candidate.id === selectedByCategory[position]) ||
      null,
  }));

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
          "Checking election controls...",
          "Preparing secure voting flow...",
        ]}
      />
    );
  }

  if (!session || error) {
    return (
      <Card className="border shadow-none">
        <CardContent className="flex items-start gap-3 p-5 sm:p-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Ballot unavailable</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {(error as Error | undefined)?.message || "This ballot could not be loaded. Try refreshing the page."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (session.has_voted) {
    return (
      <PortalPage>
        <Card className="border shadow-none">
          <CardContent className="p-5 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-foreground">
                  <CheckCircle2 className="h-5 w-5 text-background" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-foreground sm:text-lg">
                    Your ballot has already been recorded
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    You have already submitted your vote for this election. View your submitted ballot receipt or check the live results below.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
                <Button asChild>
                  <Link href={`/students/vote/${session.id}/submitted`}>
                    View submitted ballot
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/students/results/${session.id}`}>View results</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PortalPage>
    );
  }

  if (!session.eligible || session.status !== "active") {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>
          {!session.eligible ? "Not eligible" : "Election unavailable"}
        </AlertTitle>
        <AlertDescription>
          {!session.eligible
            ? session.eligibility_reason || "You are not eligible to vote in this election."
            : "This election is not currently accepting votes. Check back when it is active."}
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
    if (!canContinueFromLocation) {
      setLivenessError("Capture and verify your voting location before starting live verification.");
      toast.error("Capture and verify your voting location before starting live verification.");
      return;
    }

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
    setOwnershipVerified(null);
    setCompareConfidence(null);
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
        setOwnershipVerified(result.ownership_verified ?? null);
        setCompareConfidence(result.compare_confidence ?? null);
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

  const resetLivenessCheck = () => {
    setLivenessStatus(hasAwsLivenessWebConfig ? "idle" : "unsupported");
    setLivenessError("");
    setLivenessSessionId("");
    setLivenessRegion(awsGuestRegion);
    setLivenessConfidence(null);
    setOwnershipVerified(null);
    setCompareConfidence(null);
  };

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setLocationCheckStatus("idle");
    setLocationCheck(null);
    setLocationCheckMessage("");
    resetLivenessCheck();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "Resolving current location...",
          detail: "",
        };

        setLocation(nextLocation);
        setLocationCheckStatus("checking");

        try {
          const resolved = await resolveStudentLocationName({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });

          setLocation({
            ...nextLocation,
            label: resolved.label || "Current location",
            detail: resolved.detail,
          });
        } catch {
          setLocation({
            ...nextLocation,
            label: "Current location",
            detail: "",
          });
        }

        try {
          const check = await locationCheckMutation.mutateAsync({
            sessionId,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });

          setLocationCheck(check);
          setLocationCheckStatus(check.allowed ? "allowed" : "denied");
          setLocationCheckMessage(check.message);

          if (check.allowed) {
            toast.success(
              session.is_off_campus_allowed
                ? "Location recorded. You can continue to live verification."
                : "You are within the approved voting area.",
            );
          } else {
            resetLivenessCheck();
            toast.error(check.message);
          }
        } catch (checkError) {
          const message = getLocationCheckErrorMessage(checkError);
          const payload =
            checkError instanceof ApiError
              ? (checkError.payload as StudentLocationCheckResponse | undefined)
              : undefined;

          setLocationCheck(payload || null);
          setLocationCheckStatus(
            payload?.code === "GEOFENCE_VIOLATION" ? "denied" : "error",
          );
          setLocationCheckMessage(message);
          resetLivenessCheck();
          toast.error(message);
        }

        setIsLocating(false);
      },
      (locationError) => {
        toast.error(getLocationErrorMessage(locationError));
        setIsLocating(false);
        setLocationCheckStatus("error");
        setLocationCheck(null);
        setLocationCheckMessage(getLocationErrorMessage(locationError));
        resetLivenessCheck();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmitVote = async () => {
    if (
      !allCategoriesSelected ||
      !location ||
      locationCheckStatus !== "allowed" ||
      locationCheck?.allowed !== true ||
      livenessStatus !== "passed" ||
      ownershipVerified === false
    ) {
      toast.error(
        "Complete ballot selection, approved location check, and live verification before submitting.",
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

  // Step metadata
  const steps = [
    { value: "ballot" as VoteStep, label: "Ballot", short: "Ballot" },
    { value: "location" as VoteStep, label: "Location", short: "Loc." },
    { value: "liveness" as VoteStep, label: "Liveness", short: "Face" },
    { value: "review" as VoteStep, label: "Review", short: "Review" },
  ];

  const footerHint =
    currentStep === "ballot"
      ? allCategoriesSelected
        ? `All ${categories.length} position${categories.length !== 1 ? "s" : ""} selected`
        : `${Object.keys(selectedByCategory).length} of ${categories.length} selected`
      : currentStep === "location"
        ? canContinueFromLocation
          ? session.is_off_campus_allowed ? "Location recorded" : "Within voting area"
          : locationCheckStatus === "denied" ? "Outside voting area"
            : locationCheckStatus === "checking" ? "Verifying location…"
              : "Capture your location"
        : currentStep === "liveness"
          ? canContinueFromLiveness ? "Verification passed"
            : biometricLocked ? `Locked · ${formatCountdown(lockoutSeconds)}`
              : "Complete face check"
          : "Review and submit";

  return (
    <PortalPage className="flex min-h-full flex-col gap-3 pb-32">

      {/* ── Step header card ── */}
      <div data-tour="student-vote-hero" className="overflow-hidden rounded-2xl border">
        {/* Top: election label */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Active ballot</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{session.title}</p>
          </div>
          <span className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
            session.is_off_campus_allowed
              ? "border-emerald-300/60 bg-emerald-50/60 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "border-amber-300/50 bg-amber-50/50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-400",
          )}>
            {session.is_off_campus_allowed ? "Flexible" : "Geofenced"}
          </span>
        </div>

        {/* Step stepper */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-0">
            {steps.map(({ value, label }, index) => {
              const isCompleted =
                (value === "ballot" && allCategoriesSelected && currentStepIndex > 0) ||
                (value === "location" && canContinueFromLocation && currentStepIndex > 1) ||
                (value === "liveness" && canContinueFromLiveness && currentStep === "review");
              const isCurrent = currentStep === value;
              const isDisabled =
                (value === "location" && !allCategoriesSelected) ||
                (value === "liveness" && !canContinueFromLocation) ||
                (value === "review" && !canContinueFromLiveness);

              return (
                <div key={value} className="flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => goToStep(value)}
                    disabled={isDisabled}
                    className="flex flex-col items-center gap-1 disabled:pointer-events-none"
                  >
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                      isCurrent
                        ? "border-foreground bg-foreground text-background"
                        : isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border bg-transparent text-muted-foreground",
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    <span className={cn(
                      "hidden text-[10px] font-medium sm:block",
                      isCurrent ? "text-foreground" : "text-muted-foreground",
                    )}>
                      {label}
                    </span>
                  </button>
                  {index < steps.length - 1 ? (
                    <div className={cn(
                      "mx-1 h-[2px] flex-1 rounded-full transition-colors",
                      isCompleted ? "bg-emerald-500" : "bg-border",
                    )} />
                  ) : null}
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── STEP 1: Ballot ── */}
      {currentStep === "ballot" ? (
        <div className="flex flex-col gap-3" data-tour="student-vote-ballot">
          {categories.map(([position, candidates]) => (
            <div key={position} className="overflow-hidden rounded-2xl border">
              {/* Position header */}
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <p className="text-sm font-semibold text-foreground">{position}</p>
                {selectedByCategory[position] ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Selected
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Candidate rows */}
              <div className="divide-y">
                {candidates.map((candidate) => {
                  const selected = selectedByCategory[position] === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() =>
                        setSelectedByCategory((cur) => ({ ...cur, [position]: candidate.id }))
                      }
                      className={cn(
                        "press-scale flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                        selected ? "bg-foreground" : "hover:bg-muted/30",
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "h-11 w-11 shrink-0 overflow-hidden rounded-full border",
                        selected ? "border-background/20" : "border-border",
                      )}>
                        {candidate.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={candidate.photo_url} alt={candidate.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className={cn(
                            "flex h-full w-full items-center justify-center text-sm font-bold",
                            selected ? "text-background/50" : "text-muted-foreground/50",
                          )}>
                            {candidate.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold leading-snug", selected ? "text-background" : "text-foreground")}>
                          {candidate.name}
                        </p>
                        <p className={cn("mt-0.5 truncate text-xs", selected ? "text-background/60" : "text-muted-foreground")}>
                          {candidate.bio || "No biography provided."}
                        </p>
                      </div>

                      {/* Radio indicator */}
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected ? "border-background/60 bg-background/20" : "border-border",
                      )}>
                        {selected ? <div className="h-2 w-2 rounded-full bg-background" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── STEP 2: Location ── */}
      {currentStep === "location" ? (
        <div className="flex flex-col gap-3">
          {/* Context card */}
          <div className="overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
              <LocateFixed className="h-4 w-4 shrink-0 text-foreground" />
              <p className="text-sm font-semibold text-foreground">Voting location</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {session.is_off_campus_allowed
                  ? "This election allows flexible voting locations. Your coordinates are still recorded in the secure audit trail."
                  : "Your device must be within the approved voting area. Step outside the boundary and your vote will not be accepted."}
              </p>
              <div className="grid grid-cols-3 divide-x overflow-hidden rounded-xl border">
                {[
                  { label: "Accuracy", value: "High-precision GPS" },
                  { label: "Audit", value: "All votes logged" },
                  { label: "Privacy", value: "Encrypted" },
                ].map(({ label, value }) => (
                  <div key={label} className="px-3 py-2.5 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status + capture card */}
          <div className="overflow-hidden rounded-2xl border">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  locationCheckStatus === "allowed" ? "bg-emerald-500" :
                  locationCheckStatus === "denied" ? "bg-destructive" :
                  locationCheckStatus === "checking" ? "animate-pulse bg-amber-400" :
                  "bg-muted-foreground/40",
                )} />
                <p className="text-sm font-semibold text-foreground">
                  {locationCheckStatus === "allowed"
                    ? session.is_off_campus_allowed ? "Location recorded" : "Within voting area"
                    : locationCheckStatus === "denied" ? "Outside voting area"
                    : locationCheckStatus === "checking" ? "Verifying…"
                    : locationCheckStatus === "error" ? "Check failed"
                    : "Awaiting location"}
                </p>
              </div>
              {locationCheckStatus === "allowed" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : null}
            </div>

            <div className="space-y-3 px-4 py-4">
              {location ? (
                <div className="flex items-start gap-3 rounded-xl border px-3 py-3">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{location.label || "Current location"}</p>
                    {location.detail ? <p className="mt-0.5 text-xs text-muted-foreground">{location.detail}</p> : null}
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                    {locationCheckStatus === "allowed" && !session.is_off_campus_allowed ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMeters(locationCheck?.distance_meters)} of {formatMeters(locationCheck?.radius_meters)} radius
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {(locationCheckStatus === "denied" || locationCheckStatus === "error") ? (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>{locationCheckStatus === "denied" ? "Outside voting area" : "Location check failed"}</AlertTitle>
                  <AlertDescription>
                    {locationCheckMessage || "Capture your location again to continue."}
                    {locationCheck?.distance_meters && locationCheck?.radius_meters ? (
                      <span className="mt-1 block">
                        Distance: {formatMeters(locationCheck.distance_meters)} · Allowed: {formatMeters(locationCheck.radius_meters)}
                      </span>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="button"
                variant={locationCheckStatus === "allowed" ? "outline" : "default"}
                className="w-full rounded-xl"
                onClick={captureLocation}
                disabled={isLocating || locationCheckStatus === "checking"}
              >
                <LocateFixed className="mr-2 h-4 w-4" />
                {isLocating || locationCheckStatus === "checking"
                  ? "Verifying location…"
                  : locationCheckStatus === "allowed"
                    ? "Re-capture location"
                    : "Capture current location"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── STEP 3: Liveness ── */}
      {currentStep === "liveness" ? (
        <div className="flex flex-col gap-3">
          {biometricLocked ? (
            <Alert variant="destructive">
              <Clock3 className="h-4 w-4" />
              <AlertTitle>Verification locked · {formatCountdown(lockoutSeconds)}</AlertTitle>
              <AlertDescription>
                Too many failed attempts. Try again{lockedUntil ? ` at ${new Date(lockedUntil).toLocaleTimeString()}` : " when the timer reaches 0"}.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Main liveness card */}
          <div className="overflow-hidden rounded-2xl border">

            {/* Header — title + action, always visible */}
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Live presence check</p>
                <p className="text-[11px] text-muted-foreground">AWS Face Liveness · {
                  livenessStatus === "idle" ? "Ready to start"
                  : livenessStatus === "creating_session" ? "Creating session…"
                  : livenessStatus === "ready" ? "Camera active"
                  : livenessStatus === "processing" ? "Processing…"
                  : livenessStatus === "passed" ? "Verified ✓"
                  : livenessStatus === "locked" ? "Locked"
                  : livenessStatus === "failed" ? "Failed"
                  : "Not configured"
                }</p>
              </div>
              <Button
                type="button"
                variant={livenessStatus === "passed" ? "outline" : "default"}
                size="sm"
                className="shrink-0 rounded-xl"
                disabled={createLivenessSession.isPending || biometricLocked || livenessStatus === "ready"}
                onClick={() => void startLivenessCheck()}
              >
                <ScanFace className="mr-1.5 h-3.5 w-3.5" />
                {createLivenessSession.isPending
                  ? "Preparing…"
                  : livenessStatus === "passed"
                    ? "Run again"
                    : "Start check"}
              </Button>
            </div>

            {/* Idle / creating — instruction text + camera notice inline */}
            {livenessStatus === "idle" || livenessStatus === "creating_session" ? (
              <div className="space-y-3 px-4 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A live camera session captures your face in real time and compares it against your enrolled student biometric. No pre-uploaded photo needed.
                </p>
                <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 px-3 py-2.5">
                  <Monitor className="h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Allow camera access when prompted. Good lighting + stay still = best results.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Active camera session */}
            {livenessStatus === "ready" && livenessSessionId ? (
              <>
                {/* Detector — constrained width + height so it fits any screen */}
                <div className="liveness-constrained mx-auto w-full max-w-md overflow-hidden">
                  <FaceLivenessDetector
                    sessionId={livenessSessionId}
                    region={livenessRegion}
                    displayText={livenessDisplayText}
                    onUserCancel={() => {
                      setLivenessStatus("failed");
                      setLivenessError("Live verification was cancelled. Start again when you are ready.");
                    }}
                    onAnalysisComplete={async () => {
                      setLivenessStatus("processing");
                      setLivenessError("Analyzing live presence and confirming account ownership…");
                      await pollLivenessResult(livenessSessionId)
                        .then((result) => {
                          if (result.passed && result.ownership_verified !== false) {
                            toast.success("Live verification passed. Account ownership confirmed.");
                          } else {
                            toast.error(
                              result.ownership_verified === false
                                ? "The person in the live check is not the account owner."
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
                {/* Tips strip */}
                <div className="grid grid-cols-3 divide-x border-t">
                  {[
                    { label: "Lighting", tip: "Even light, no backlight" },
                    { label: "Framing", tip: "One face, centered" },
                    { label: "Stability", tip: "Hold still until done" },
                  ].map(({ label, tip }) => (
                    <div key={label} className="px-3 py-2.5 text-center">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
                      <p className="mt-0.5 text-[11px] text-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* Result / status banner — shown after camera closes */}
            {livenessStatus !== "ready" && livenessStatus !== "idle" && livenessStatus !== "creating_session" ? (
              <div className={cn(
                "mx-4 mb-3 flex items-start gap-3 rounded-xl border px-4 py-3",
                livenessStatus === "passed"
                  ? "border-emerald-300/60 bg-emerald-50/60 dark:border-emerald-700/40 dark:bg-emerald-950/30"
                  : livenessStatus === "processing"
                    ? "border-primary/20 bg-primary/5"
                    : "border-destructive/30 bg-destructive/5",
              )}>
                {livenessStatus === "passed"
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  : <ScanFace className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {livenessStatus === "passed" ? "Verification complete"
                      : livenessStatus === "processing" ? "Processing…"
                      : livenessStatus === "failed" ? "Verification failed"
                      : livenessStatus === "locked" ? "Temporarily locked"
                      : "Status"}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {livenessError || (livenessStatus === "passed"
                      ? "Live presence and account ownership confirmed. Proceed to review."
                      : "")}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Compact details table */}
            <div className="mx-4 mb-4 overflow-hidden rounded-xl border">
              <div className="divide-y">
                {[
                  { label: "Liveness score", value: typeof livenessConfidence === "number" ? `${livenessConfidence.toFixed(1)}%` : "—" },
                  { label: "Account owner", value: ownershipVerified === null ? "Pending" : ownershipVerified ? "Confirmed" : "Not confirmed" },
                  { label: "Face match", value: typeof compareConfidence === "number" ? `${compareConfidence.toFixed(1)}%` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : null}

      {/* ── STEP 4: Review ── */}
      {currentStep === "review" ? (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_340px] lg:items-start">

          {/* Left: selections + verifications */}
          <div className="flex flex-col gap-3">
            {/* Ballot selections */}
            <div className="overflow-hidden rounded-2xl border">
              <div className="flex items-center gap-2 border-b px-4 py-2.5">
                <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Your ballot</p>
              </div>
              <div className="divide-y">
                {reviewSelections.map(({ position, candidate }) => (
                  <div key={position} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border">
                      {candidate?.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={candidate.photo_url} alt={candidate.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground/50">
                          {candidate?.name?.charAt(0) ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{position}</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{candidate?.name || "Not selected"}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Location + liveness chips */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="overflow-hidden rounded-xl border">
                <div className="border-b px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Location</p>
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="truncate text-xs font-semibold text-foreground">{location?.label || "—"}</p>
                  </div>
                  {locationCheckStatus === "allowed" ? (
                    <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      {session.is_off_campus_allowed ? "Recorded for audit" : `Within ${formatMeters(locationCheck?.radius_meters)}`}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border">
                <div className="border-b px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Face check</p>
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <ScanFace className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">{ownershipVerified ? "Verified" : "Pending"}</p>
                  </div>
                  {typeof livenessConfidence === "number" ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">Score {livenessConfidence.toFixed(1)}%</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Right (sticky on desktop): submit panel */}
          <div className="overflow-hidden rounded-2xl border lg:sticky lg:top-4">
            <div className="border-b px-4 py-2.5">
              <p className="text-sm font-semibold text-foreground">Submit your vote</p>
            </div>
            <div className="space-y-4 px-4 py-4">
              {biometricLocked ? (
                <Alert variant="destructive">
                  <Clock3 className="h-4 w-4" />
                  <AlertTitle>Submission locked</AlertTitle>
                  <AlertDescription>Locked for {formatCountdown(lockoutSeconds)} due to repeated failed biometric attempts.</AlertDescription>
                </Alert>
              ) : null}

              {/* Checklist */}
              <div className="space-y-2">
                {[
                  { label: "Ballot selections", done: allCategoriesSelected },
                  { label: "Location approved", done: canContinueFromLocation },
                  { label: "Live presence verified", done: livenessStatus === "passed" },
                  { label: "Account ownership confirmed", done: ownershipVerified === true },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      done ? "border-emerald-500 bg-emerald-500" : "border-border",
                    )}>
                      {done ? <CheckCircle2 className="h-3 w-3 text-white" /> : null}
                    </div>
                    <p className={cn("text-sm", done ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Once submitted, your ballot cannot be changed. All security checks must pass before your vote is recorded.
              </p>

              <Button
                type="button"
                className="h-11 w-full rounded-xl font-semibold"
                disabled={submitVote.isPending || biometricLocked}
                onClick={() => void handleSubmitVote()}
              >
                {submitVote.isPending ? (
                  <LoadingButtonContent label="Submitting…" />
                ) : (
                  <>
                    <Vote className="mr-2 h-4 w-4" />
                    Submit ballot
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Fixed bottom footer bar ── */}
      <div
        data-tour="student-vote-footer"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-md"
      >
        <div className="mx-auto max-w-3xl px-3 py-3 sm:px-4">
          <div className="flex items-center gap-3">
            {/* Status hint */}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{footerHint}</p>
            </div>

            {/* Back */}
            {currentStep !== "ballot" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0 rounded-xl px-3"
                onClick={() => setCurrentStep(stepOrder[currentStepIndex - 1] || "ballot")}
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            ) : null}

            {/* Continue / Submit */}
            {currentStep !== "review" ? (
              <Button
                type="button"
                size="sm"
                className="h-10 shrink-0 rounded-xl px-4 font-semibold"
                disabled={
                  (currentStep === "ballot" && !allCategoriesSelected) ||
                  (currentStep === "location" && !canContinueFromLocation) ||
                  (currentStep === "liveness" && !canContinueFromLiveness)
                }
                onClick={() => setCurrentStep(stepOrder[Math.min(currentStepIndex + 1, stepOrder.length - 1)])}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-10 shrink-0 rounded-xl px-4 font-semibold"
                onClick={() => void handleSubmitVote()}
                disabled={submitVote.isPending || biometricLocked}
              >
                {submitVote.isPending ? (
                  <LoadingButtonContent label="Submitting…" />
                ) : (
                  <>
                    <Vote className="mr-1.5 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PortalPage>
  );
}
