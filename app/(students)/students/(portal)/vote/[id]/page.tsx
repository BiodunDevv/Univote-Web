"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  MapPin,
  RotateCcw,
  ShieldAlert,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { PortalPage } from "@/components/students/portal/portal-page";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  useStudentSessionDetailQuery,
  useSubmitVoteMutation,
} from "@/lib/queries/student";
import { ApiError } from "@/lib/api/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type VoteStep = "ballot" | "verification" | "review";
type SelfieStatus = "idle" | "choosing" | "uploading" | "ready" | "error";

function getVoteErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "ALREADY_VOTED") {
      return "Your vote has already been recorded for this session.";
    }
    if (error.code === "GEOFENCE_VIOLATION") {
      return "You are outside the approved voting radius for this session. Move into the allowed area and try again.";
    }
    if (error.code === "FACE_VERIFICATION_FAILED") {
      const confidence = error.payload?.confidence;
      return typeof confidence === "number"
        ? `Face verification did not pass. Current confidence score: ${confidence.toFixed(1)}. Use a clearer selfie and try again.`
        : error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not submit your vote. Please try again.";
}

export default function StudentVotePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSessionDetailQuery(sessionId);
  const submitVote = useSubmitVoteMutation();

  const [selectedByCategory, setSelectedByCategory] = useState<
    Record<string, string>
  >({});
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState<VoteStep>("ballot");
  const [isLocating, setIsLocating] = useState(false);
  const [selfieStatus, setSelfieStatus] = useState<SelfieStatus>("idle");
  const [selfieError, setSelfieError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const session = data?.session;

  const categories = useMemo(
    () => Object.entries(session?.candidates_by_position || {}),
    [session?.candidates_by_position],
  );

  const stepOrder: VoteStep[] = ["ballot", "verification", "review"];
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;
  const allCategoriesSelected =
    categories.length > 0 &&
    categories.every(([position]) => Boolean(selectedByCategory[position]));
  const canContinueFromVerification = Boolean(imageUrl && location);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading ballot...",
          "Checking session controls...",
          "Preparing candidate selection...",
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

  const handleUpload = async (file: File) => {
    setSelfieError("");
    setSelfieStatus("uploading");

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    try {
      const uploaded = await uploadImageToCloudinary(
        file,
        "univote/student-votes",
      );
      setImageUrl(uploaded);
      setSelfieStatus("ready");
      toast.success("Selfie uploaded successfully.");
    } catch (uploadError) {
      setSelfieStatus("error");
      setSelfieError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload image.",
      );
      toast.error(
        uploadError instanceof Error ? uploadError.message : "Failed to upload image",
      );
    }
  };

  const openSelfiePicker = () => {
    setSelfieError("");
    setSelfieStatus("choosing");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const resetSelfie = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImagePreviewUrl("");
    setImageUrl("");
    setSelfieError("");
    setSelfieStatus("idle");
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
            ? "Location captured. This session allows flexible voting locations."
            : "Location captured. You can now continue to vote review.",
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
    if (!allCategoriesSelected || !imageUrl || !location) {
      toast.error(
        "Complete candidate selection, selfie upload, and location capture before submitting.",
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
        imageUrl,
        location,
        deviceId:
          typeof navigator !== "undefined" ? navigator.userAgent : "web-client",
      });

      toast.success("Vote submitted successfully.");
      router.replace(`/students/results/${sessionId}?fromVote=1`);
    } catch (submitError) {
      toast.error(getVoteErrorMessage(submitError));
    }
  };

  return (
    <PortalPage className="flex min-h-full flex-col gap-4 pb-28">
      <section className="rounded-3xl border bg-linear-to-br from-card via-card to-muted/30 p-4 shadow-none sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Active ballot</Badge>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {session.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Cast your vote in one guided full-screen flow. Complete ballot
                selection, selfie verification, location capture, and final review
                without leaving this page.
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
                ["verification", "Verification"],
                ["review", "Review"],
              ].map(([value, label], index) => (
                <Badge
                  key={value}
                  variant={currentStep === value ? "default" : "outline"}
                  className="rounded-full px-3 py-1"
                >
                  {index + 1}. {label}
                </Badge>
              ))}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          {currentStep === "ballot" ? (
            <>
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
                          className={`rounded-2xl border p-3 text-left transition-colors ${
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-muted/20 text-foreground hover:border-foreground/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-2xl border bg-background/70">
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
                                {selected ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                                ) : null}
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
            </>
          ) : null}

          {currentStep === "verification" ? (
            <div className="grid gap-4">
              <Card className="border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Selfie verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Upload a clear selfie
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Face++ will compare this selfie against your registered
                          facial profile before your vote is accepted.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleUpload(file);
                          } else {
                            setSelfieStatus("idle");
                          }
                          event.target.value = "";
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={selfieStatus === "uploading"}
                          onClick={openSelfiePicker}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          {selfieStatus === "uploading"
                            ? "Uploading..."
                            : selfieStatus === "ready"
                              ? "Retake selfie"
                              : selfieStatus === "choosing"
                                ? "Choose selfie"
                                : "Upload selfie"}
                        </Button>
                        {(selfieStatus === "ready" || selfieStatus === "error") &&
                        imagePreviewUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={resetSelfie}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                      <div className="overflow-hidden rounded-2xl border bg-muted/30">
                        {imagePreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreviewUrl}
                            alt="Selfie preview"
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
                            No selfie selected
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 rounded-2xl border bg-background/70 p-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Status
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-sm font-semibold",
                              selfieStatus === "error"
                                ? "text-destructive"
                                : "text-foreground",
                            )}
                          >
                            {selfieStatus === "idle"
                              ? "Waiting for selfie"
                              : selfieStatus === "choosing"
                                ? "Waiting for photo selection"
                                : selfieStatus === "uploading"
                                  ? "Uploading selfie"
                                  : selfieStatus === "ready"
                                    ? "Ready for biometric verification"
                                    : "Upload failed"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selfieStatus === "ready"
                            ? "Your selfie is ready and will be checked against your enrolled face before the vote is accepted."
                            : "Use a clear front-facing image with good lighting and only one visible face."}
                        </p>
                        {selfieError ? (
                          <Alert variant="destructive">
                            <AlertDescription>{selfieError}</AlertDescription>
                          </Alert>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Capture your location
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.is_off_campus_allowed
                            ? "This session allows off-campus voting, but your location is still recorded for audit and verification."
                            : "Your location must be inside the approved voting radius for this session."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={captureLocation}
                        disabled={isLocating}
                      >
                        <LocateFixed className="mr-2 h-4 w-4" />
                        {isLocating ? "Locating..." : "Use current location"}
                      </Button>
                    </div>
                    {location ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {currentStep === "review" ? (
            <Card className="border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Final review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {categories.map(([position, candidates]) => {
                    const selectedCandidate = candidates.find(
                      (candidate) => candidate.id === selectedByCategory[position],
                    );

                    return (
                      <div
                        key={position}
                        className="rounded-2xl border bg-muted/20 p-4"
                      >
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {position}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {selectedCandidate?.name || "No candidate selected"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Selfie
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {imageUrl ? "Ready for verification" : "Not uploaded"}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {location
                        ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : "Not captured"}
                    </p>
                  </div>
                </div>

                {submitVote.error ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {getVoteErrorMessage(submitVote.error)}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Voting checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-medium text-foreground">Ballot selection</p>
                <p className="mt-1 text-muted-foreground">
                  {Object.keys(selectedByCategory).length} of {categories.length}{" "}
                  categories completed.
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-medium text-foreground">Selfie status</p>
                <p className="mt-1 text-muted-foreground">
                  {imageUrl
                    ? "A selfie is ready for biometric verification."
                    : "Upload a clear selfie to continue."}
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-medium text-foreground">Location status</p>
                <p className="mt-1 text-muted-foreground">
                  {location
                    ? session.is_off_campus_allowed
                      ? "Location captured. This session supports flexible locations."
                      : "Location captured. Your position will be checked against the session radius."
                    : "Capture your current coordinates before you submit."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Session conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Status: <span className="font-medium text-foreground">{session.status}</span>
              </p>
              <p>
                Location policy:{" "}
                <span className="font-medium text-foreground">
                  {session.is_off_campus_allowed
                    ? "Off-campus voting allowed"
                    : "Inside approved radius only"}
                </span>
              </p>
              <p>
                Submission rule: one successful vote only. Duplicate and concurrent
                submissions are blocked automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border bg-background p-3 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Guided voting flow
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {currentStep === "ballot"
                    ? allCategoriesSelected
                      ? "Ballot complete. Continue to verification."
                      : "Select one candidate in every category."
                    : currentStep === "verification"
                      ? canContinueFromVerification
                        ? "Verification inputs complete. Continue to final review."
                        : "Upload a selfie and capture your location."
                      : "Submit your final vote once everything looks correct."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentStep !== "ballot" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentStep(stepOrder[currentStepIndex - 1] || "ballot")
                    }
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : null}

                {currentStep === "ballot" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={!allCategoriesSelected}
                    onClick={() => setCurrentStep("verification")}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}

                {currentStep === "verification" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canContinueFromVerification}
                    onClick={() => setCurrentStep("review")}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}

                {currentStep === "review" ? (
                  <Button
                    onClick={() => void handleSubmitVote()}
                    disabled={
                      submitVote.isPending ||
                      !allCategoriesSelected ||
                      !imageUrl ||
                      !location
                    }
                    size="sm"
                    className="shrink-0"
                  >
                    <Vote className="mr-2 h-4 w-4" />
                    {submitVote.isPending ? "Submitting..." : "Submit vote"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalPage>
  );
}
