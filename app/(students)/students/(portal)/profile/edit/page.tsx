"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Camera, Eye, Headset } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
    !hasApprovedPhotoReset &&
    photoUrl !== (profileQuery.data.photo_url || "");
  const initials = (fullName || profileQuery.data.full_name)
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const photoPreview = photoUrl || profileQuery.data.photo_url || "";
  const nextPhotoUpdateText = hasApprovedPhotoReset
    ? "Your support-approved photo reset is active. You can make one profile photo update now, and the approval will be consumed after a successful save."
    : profileQuery.data.next_profile_photo_update_at
      ? `Next self-service update opens ${new Date(
          profileQuery.data.next_profile_photo_update_at,
        ).toLocaleDateString("en-NG", {
          dateStyle: "medium",
        })}.`
      : "You can update your photo now. After a successful change, the next self-service update opens in six months.";

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
        description: `I need an early profile photo reset so I can upload a new picture before the self-service cooldown expires.\n\nStudent: ${
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
      toast.success("Photo reset request sent for review");
      router.push(`/students/profile?tab=support&ticket=${response.ticket?.id || ""}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create support request",
      );
    }
  };

  return (
    <PortalPage className="min-h-[calc(100dvh-7rem)]">
      <div className="grid min-h-full gap-4 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
        <Card className="rounded-4xl border shadow-none lg:sticky lg:top-3 lg:h-fit">
          <CardHeader className="space-y-3 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Profile photo</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2 text-xs"
                onClick={() => router.push("/students/profile")}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View profile
              </Button>
            </div>
            <div className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border bg-muted/20 p-1 transition hover:bg-muted/35"
                    aria-label="Open profile photo preview"
                  >
                    <Avatar className="h-36 w-36 rounded-full">
                      <AvatarImage
                      className="object-cover"
                        src={photoPreview || undefined}
                        alt={fullName || "Profile photo"}
                      />
                      <AvatarFallback className="text-2xl">
                        {initials || "ST"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Profile photo</DialogTitle>
                    <DialogDescription>
                      Full-size preview of your current profile image.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-2xl border bg-muted/20 p-2">
                    <Avatar className="h-[300px] w-full rounded-xl">
                      <AvatarImage
                        src={photoPreview || undefined}
                        alt={fullName || "Profile photo"}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-3xl">
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
                if (file) {
                  void handleUpload(file);
                }
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl"
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
                className="w-full rounded-2xl"
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

            <div className="flex items-start gap-2 rounded-2xl border bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {nextPhotoUpdateText}
                {cooldownBlocked
                  ? " Need an earlier change? Send a reset request and the support team can approve or decline it in your support thread."
                  : hasApprovedPhotoReset
                    ? " Make sure the image is a clear single-person facial photo. Random pictures or non-face images will be rejected automatically."
                    : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-full flex-col rounded-4xl border shadow-none">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Profile settings
                </p>
                <CardTitle className="mt-1 text-lg">
                  Edit your details
                </CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => router.push("/students/profile")}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  className="h-11 rounded-xl"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-11 rounded-xl"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-url">Photo URL</Label>
              <Input
                id="photo-url"
                value={photoUrl}
                className="h-11 rounded-xl"
                onChange={(event) => setPhotoUrl(event.target.value)}
                placeholder="https://example.com/photo.jpg"
                disabled={cooldownBlocked}
              />
              <p className="text-xs text-muted-foreground">
                Paste an image URL or upload directly from your device.
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
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => router.push("/students/profile")}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-2xl"
                  onClick={async () => {
                    await updateProfile.mutateAsync({
                      full_name: fullName,
                      email,
                      photo_url: photoUrl || null,
                    });
                    toast.success("Profile updated");
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
