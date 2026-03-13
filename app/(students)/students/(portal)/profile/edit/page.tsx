"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  useStudentProfileQuery,
  useUpdateStudentProfileMutation,
} from "@/lib/queries/student";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudentProfileEditPage() {
  const profileQuery = useStudentProfileQuery();
  const updateProfile = useUpdateStudentProfileMutation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.full_name);
    setEmail(profileQuery.data.email);
    setPhotoUrl(profileQuery.data.photo_url || "");
  }, [profileQuery.data]);

  if (profileQuery.isLoading) {
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
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {(profileQuery.error as Error | undefined)?.message ||
            "Profile could not be loaded."}
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card className="border shadow-none">
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
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
          <div className="flex flex-wrap items-center gap-3">
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
              <Button type="button" variant="outline" disabled={uploading}>
                <Camera className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload photo"}
              </Button>
            </label>
            <Input
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
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
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
