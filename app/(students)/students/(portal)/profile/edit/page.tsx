"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Camera, Headset } from "lucide-react";
import { toast } from "sonner";
import {
  ChangingLoadingState,
  LoadingButtonContent,
} from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalHero,
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
  const cooldownBlocked =
    typeof nextPhotoUpdateAt === "string" &&
    new Date(nextPhotoUpdateAt).getTime() > Date.now() &&
    photoUrl !== (profileQuery.data.photo_url || "");

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
      toast.success("Photo reset request sent");
      router.push(`/students/support?ticket=${response.ticket?.id || ""}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create support request",
      );
    }
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Profile"
        title="Edit your details"
        description="Keep your account identity current. Profile photo updates follow the six-month security policy."
      />
      <Card className="rounded-[2rem] border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Profile details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            <Label>Profile photo</Label>
            <div className="grid gap-3">
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
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading || cooldownBlocked}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <LoadingButtonContent label="Uploading photo..." />
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Upload photo
                    </>
                  )}
                </Button>
                {cooldownBlocked ? (
                  <Button
                    type="button"
                    variant="secondary"
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
              </div>
              <Input
                value={photoUrl}
                onChange={(event) => setPhotoUrl(event.target.value)}
                placeholder="https://example.com/photo.jpg"
                disabled={cooldownBlocked}
              />
              <div className="flex items-start gap-2 rounded-2xl border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {profileQuery.data.next_profile_photo_update_at
                    ? `Your next self-service photo update opens ${new Date(
                        profileQuery.data.next_profile_photo_update_at,
                      ).toLocaleDateString("en-NG", {
                        dateStyle: "medium",
                      })}. If you need an earlier change, submit a support request.`
                    : "You can update your profile photo from this screen. After a successful change, the next self-service update will be available in six months."}
                </span>
              </div>
            </div>
          </div>

          {updateProfile.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {(updateProfile.error as Error).message}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end">
            <Button
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
        </CardContent>
      </Card>
    </PortalPage>
  );
}
