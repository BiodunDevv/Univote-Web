"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, LocateFixed, MapPin, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useStudentSessionDetailQuery, useSubmitVoteMutation } from "@/lib/queries/student";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentVotePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSessionDetailQuery(sessionId);
  const submitVote = useSubmitVoteMutation();

  const [selectedByCategory, setSelectedByCategory] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const session = data?.session;

  const categories = useMemo(
    () => Object.entries(session?.candidates_by_position || {}),
    [session?.candidates_by_position],
  );

  const allCategoriesSelected =
    categories.length > 0 &&
    categories.every(([position]) => Boolean(selectedByCategory[position]));

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
    setIsUploading(true);
    try {
      const uploaded = await uploadImageToCloudinary(file, "univote/student-votes");
      setImageUrl(uploaded);
      toast.success("Selfie uploaded");
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error ? uploadError.message : "Failed to upload image",
      );
    } finally {
      setIsUploading(false);
    }
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
        toast.success("Location captured");
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
      toast.error("Select all categories, upload a selfie, and capture your location.");
      return;
    }

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

    toast.success("Vote submitted successfully");
    router.replace(`/students/results/${sessionId}?fromVote=1`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-none">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline">Active ballot</Badge>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">
              {session.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select one candidate per category, then verify your location and selfie before submitting.
            </p>
          </div>
          <Button
            onClick={() => void handleSubmitVote()}
            disabled={
              submitVote.isPending || !allCategoriesSelected || !imageUrl || !location
            }
          >
            {submitVote.isPending ? "Submitting vote..." : "Submit vote"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          {categories.map(([position, candidates]) => (
            <Card key={position} className="border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{position}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
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
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-muted/20 text-foreground hover:border-foreground/40"
                      }`}
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
                        <div>
                          <p className="font-semibold">{candidate.name}</p>
                          <p className="mt-1 text-sm opacity-80">
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

        <div className="space-y-4">
          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Verification checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Selfie upload</p>
                    <p className="text-sm text-muted-foreground">
                      Upload the selfie that will be used for face verification.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleUpload(file);
                        }
                        event.target.value = "";
                      }}
                    />
                    <Button type="button" variant="outline" disabled={isUploading}>
                      <Camera className="mr-2 h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </label>
                </div>
                {imageUrl ? (
                  <p className="mt-3 text-xs text-muted-foreground">{imageUrl}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Location capture</p>
                    <p className="text-sm text-muted-foreground">
                      Capture your current coordinates before you submit the ballot.
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={captureLocation} disabled={isLocating}>
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

              <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                {Object.keys(selectedByCategory).length} of {categories.length} categories selected.
              </div>

              {submitVote.error ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(submitVote.error as Error).message}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
