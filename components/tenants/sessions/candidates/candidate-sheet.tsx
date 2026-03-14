"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Trash2, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SessionCandidate } from "@/types/session";
import { uploadCandidateImage } from "@/components/tenants/sessions/candidates/upload-candidate-image";

export type CandidateSheetMode = "view" | "edit" | "create";

export type CandidateSheetPayload = {
  name: string;
  position: string;
  photo_url: string;
  bio: string;
  manifesto: string;
};

type CandidateSheetProps = {
  open: boolean;
  mode: CandidateSheetMode;
  candidate: SessionCandidate | null;
  categories: string[];
  canManage: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: CandidateSheetMode) => void;
  onSubmit: (payload: CandidateSheetPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function CandidateSheet({
  open,
  mode,
  candidate,
  categories,
  canManage,
  isSaving,
  onOpenChange,
  onModeChange,
  onSubmit,
  onDelete,
}: CandidateSheetProps) {
  const [formData, setFormData] = useState<CandidateSheetPayload>({
    name: "",
    position: "",
    photo_url: "",
    bio: "",
    manifesto: "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormData({
      name: candidate?.name || "",
      position: candidate?.position || "",
      photo_url: candidate?.photo_url || "",
      bio: candidate?.bio || "",
      manifesto: candidate?.manifesto || "",
    });
  }, [candidate, open, mode]);

  const title =
    mode === "create"
      ? "Add Candidate"
      : mode === "edit"
        ? "Edit Candidate"
        : "Candidate Profile";

  const description =
    mode === "view"
      ? "Review the candidate profile and ballot placement."
      : "Use the form below to keep the session ballot accurate and complete.";

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const photoUrl = await uploadCandidateImage(file);
      setFormData((prev) => ({ ...prev, photo_url: photoUrl }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setUploading(false);
    }
  };

  const submitDisabled =
    isSaving ||
    uploading ||
    !formData.name.trim() ||
    !formData.position.trim() ||
    !formData.photo_url.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-4">
          <div className="overflow-hidden rounded-3xl border bg-muted">
            <div className="flex aspect-[4/3] items-center justify-center">
              {formData.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.photo_url}
                  alt={formData.name || "Candidate"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="space-y-2 text-center">
                  <UserPlus className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Candidate image preview
                  </p>
                </div>
              )}
            </div>
          </div>

          {mode === "view" ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Candidate
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {candidate?.name || "Unnamed candidate"}
                </p>
                <p className="mt-1 text-sm text-primary">
                  {candidate?.position || "No category assigned"}
                </p>
              </div>

              <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Bio</p>
                  <p className="mt-1 text-sm text-foreground">
                    {candidate?.bio || "No bio added yet."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Manifesto
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {candidate?.manifesto || "No manifesto added yet."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Votes
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {candidate?.vote_count ?? 0}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void onSubmit({
                  name: formData.name.trim(),
                  position: formData.position,
                  photo_url: formData.photo_url.trim(),
                  bio: formData.bio.trim(),
                  manifesto: formData.manifesto.trim(),
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="candidate-name">Name</Label>
                <Input
                  id="candidate-name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, position: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Candidate Photo</Label>
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
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                <Input
                  value={formData.photo_url}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      photo_url: event.target.value,
                    }))
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="candidate-bio">Bio</Label>
                <Textarea
                  id="candidate-bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, bio: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="candidate-manifesto">Manifesto</Label>
                <Textarea
                  id="candidate-manifesto"
                  rows={5}
                  value={formData.manifesto}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      manifesto: event.target.value,
                    }))
                  }
                />
              </div>

              <SheetFooter className="border-t px-0 pt-4">
                {mode === "edit" && canManage && onDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-auto text-destructive hover:text-destructive"
                    onClick={() => void onDelete()}
                    disabled={isSaving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitDisabled}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : mode === "create" ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Candidate
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>

        {mode === "view" && canManage ? (
          <SheetFooter className="border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onModeChange("edit")}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Candidate
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
