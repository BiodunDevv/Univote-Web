"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Camera, Headset, X } from "lucide-react";
import { toast } from "sonner";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  useStudentProfileQuery,
  useUpdateStudentProfileMutation,
} from "@/lib/queries/student";
import { useCreateSupportTicketMutation } from "@/lib/queries/support";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function StudentProfileEditPage() {
  const router = useRouter();
  const profileQuery = useStudentProfileQuery();
  const updateProfile = useUpdateStudentProfileMutation();
  const createSupportTicket = useCreateSupportTicketMutation("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.full_name);
    setEmail(profileQuery.data.email);
    setPhotoUrl(profileQuery.data.photo_url || "");
  }, [profileQuery.data]);

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading editable profile...",
          "Preparing account form...",
          "Checking saved details...",
        ]}
      />
    );
  }

  if (!profileQuery.data || profileQuery.error) {
    return (
      <PortalEmptyState
        title="Profile unavailable"
        description={
          (profileQuery.error as Error | undefined)?.message ||
          "Profile could not be loaded."
        }
      />
    );
  }

  const nextPhotoUpdateAt = profileQuery.data.next_profile_photo_update_at;
  const hasApprovedPhotoReset = Boolean(
    profileQuery.data.profile_photo_reset_granted_at,
  );
  const cooldownBlocked =
    typeof nextPhotoUpdateAt === "string" &&
    new Date(nextPhotoUpdateAt).getTime() > Date.now() &&
    !hasApprovedPhotoReset;

  const initials = (fullName || profileQuery.data.full_name)
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const photoPreview = photoUrl || profileQuery.data.photo_url || "";

  const nextPhotoUpdateText = hasApprovedPhotoReset
    ? "Support-approved reset active — one update available now."
    : profileQuery.data.next_profile_photo_update_at
      ? `Next self-service update: ${new Date(
          profileQuery.data.next_profile_photo_update_at,
        ).toLocaleDateString("en-NG", { dateStyle: "medium" })}.`
      : "After a successful change, the next self-service update opens in six months.";

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await uploadImageToCloudinary(
        file,
        "univote/student-profiles",
      );
      setPhotoUrl(uploaded);
      toast.success("Profile photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoResetRequest = async () => {
    try {
      const response = await createSupportTicket.mutateAsync({
        subject: "Profile photo reset request",
        description: `I need an early profile photo reset.\n\nStudent: ${
          profileQuery.data?.full_name
        }\nIdentifier: ${
          profileQuery.data?.matric_no || profileQuery.data?.email || "N/A"
        }\nCurrent photo URL: ${
          profileQuery.data?.photo_url || "Not set"
        }\nNext self-service update: ${
          profileQuery.data?.next_profile_photo_update_at || "Unknown"
        }`,
        category: "account",
        priority: "medium",
      });
      toast.success("Photo reset request sent");
      router.push(
        `/students/profile?tab=support&ticket=${response.ticket?.id || ""}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create request",
      );
    }
  };

  return (
    <PortalPage className="min-h-[calc(100dvh-7rem)]">
      <div className="animate-slide-up grid min-h-full gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
        {/* Photo panel */}
        <Card className="rounded-2xl border shadow-none lg:sticky lg:top-3 lg:h-fit">
          <CardHeader className="space-y-3 pb-2">
            <CardTitle className="text-sm font-semibold">
              Profile photo
            </CardTitle>
            <div className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="press-scale relative rounded-full transition"
                    aria-label="Preview profile photo"
                  >
                    <Avatar className="h-32 w-32 rounded-full border-2 border-border">
                      <AvatarImage
                        className="object-cover"
                        src={photoPreview || undefined}
                        alt={fullName || "Profile photo"}
                      />
                      <AvatarFallback className="text-2xl font-semibold">
                        {initials || "ST"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-foreground text-background">
                      <Camera className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Profile photo</DialogTitle>
                    <DialogDescription>
                      Full-size preview of your current profile image.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-hidden rounded-2xl border bg-muted/20">
                    <Avatar className="h-72 w-full rounded-none">
                      <AvatarImage
                        src={photoPreview || undefined}
                        alt={fullName || "Profile photo"}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-4xl font-semibold">
                        {initials || "ST"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />

            <Button
              type="button"
              variant="outline"
              className="press-scale w-full rounded-xl"
              disabled={uploading || cooldownBlocked}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <LoadingButtonContent label="Uploading photo..." />
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Upload new photo
                </>
              )}
            </Button>

            {cooldownBlocked ? (
              <Button
                type="button"
                variant="secondary"
                className="press-scale w-full rounded-xl"
                onClick={() => void handlePhotoResetRequest()}
                disabled={createSupportTicket.isPending}
              >
                {createSupportTicket.isPending ? (
                  <LoadingButtonContent label="Requesting reset..." />
                ) : (
                  <>
                    <Headset className="mr-2 h-4 w-4" />
                    Request photo reset
                  </>
                )}
              </Button>
            ) : null}

            <div className="flex items-start gap-2.5 rounded-xl border bg-muted/20 px-3 py-3">
              <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {nextPhotoUpdateText}
                {cooldownBlocked
                  ? " Send a reset request for early approval."
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form panel */}
        <Card className="flex min-h-full flex-col rounded-2xl border shadow-none">
          <CardContent className="flex flex-1 flex-col space-y-5 pt-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <InputGroup className="h-11 rounded-xl md:h-10">
                  <InputGroupInput
                    id="full-name"
                    className="text-base md:text-sm"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <InputGroup className="h-11 rounded-xl md:h-10">
                  <InputGroupInput
                    id="email"
                    type="email"
                    className="text-base md:text-sm"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </InputGroup>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photo-url">Photo URL</Label>
              <InputGroup className="h-11 rounded-xl md:h-10">
                <InputGroupInput
                  id="photo-url"
                  value={photoUrl}
                  className="text-base md:text-sm"
                  onChange={(event) => setPhotoUrl(event.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  disabled={cooldownBlocked}
                />
                {photoUrl ? (
                  <InputGroupAddon align="inline-end">
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Clear photo URL"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Paste an image URL or upload directly from your device above.
              </p>
            </div>

            {updateProfile.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {(updateProfile.error as Error).message}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-auto space-y-3">
              <Separator />
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => router.push("/students/profile")}
                >
                  Cancel
                </Button>
                <Button
                  className="press-scale rounded-xl"
                  onClick={async () => {
                    await updateProfile.mutateAsync({
                      full_name: fullName,
                      email,
                      photo_url: photoUrl || null,
                    });
                    toast.success("Profile updated successfully");
                    router.push("/students/profile");
                  }}
                  disabled={updateProfile.isPending || cooldownBlocked}
                >
                  {updateProfile.isPending ? (
                    <LoadingButtonContent label="Saving changes..." />
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalPage>
  );
}
