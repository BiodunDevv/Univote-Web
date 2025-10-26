"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, User, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

interface Candidate {
  _id: string;
  session_id:
    | string
    | {
        _id: string;
        title: string;
        status: string;
        start_time?: string;
        end_time?: string;
      };
  name: string;
  position: string;
  photo_url?: string;
  bio?: string;
  manifesto?: string;
  vote_count?: number;
}

interface SessionDetails {
  _id: string;
  title: string;
  status: string;
  categories: string[];
}

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const candidateId = params.candidateId as string;

  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    position: "",
    photo_url: "",
    bio: "",
    manifesto: "",
  });

  // Fetch candidate and session data
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        setDataLoading(true);

        // Fetch candidate data
        const candidateResponse = await api.get<{
          candidate: Candidate;
        }>(`/api/admin/candidates/${candidateId}`);

        setCandidate(candidateResponse.data.candidate);

        // Fetch full session details to get categories
        const sessionResponse = await api.get<{
          session: {
            _id: string;
            title: string;
            status: string;
            categories: Array<string | { name: string }>;
          };
        }>(`/api/admin/sessions/${sessionId}`);

        const sessionData = sessionResponse.data.session;

        // Extract categories (handle both string[] and object[] formats)
        const categoryList = sessionData.categories.map((cat) =>
          typeof cat === "string" ? cat : cat.name
        );

        setCategories(categoryList);
        setSession({
          _id: sessionData._id,
          title: sessionData.title,
          status: sessionData.status,
          categories: categoryList,
        });

        setFormData({
          name: candidateResponse.data.candidate.name || "",
          position: candidateResponse.data.candidate.position || "",
          photo_url: candidateResponse.data.candidate.photo_url || "",
          bio: candidateResponse.data.candidate.bio || "",
          manifesto: candidateResponse.data.candidate.manifesto || "",
        });
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load candidate data");
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [candidateId, sessionId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.patch(`/api/admin/candidates/${candidateId}`, formData);
      router.push(`/dashboard/sessions/${sessionId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update candidate"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError(
        "Cloudinary configuration is missing. Please check your environment variables."
      );
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("upload_preset", uploadPreset);
      formDataUpload.append("folder", "univote/candidates");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, photo_url: data.secure_url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading candidate...</p>
        </div>
      </div>
    );
  }

  if (!candidate || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Candidate not found</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 rounded-full hover:bg-accent shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Edit Candidate
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block truncate">
                {session.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <Card className="p-4 sm:p-6 border shadow-none">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Candidate Information
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter candidate's full name"
                  required
                  className="h-10 bg-background text-sm"
                />
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <Label htmlFor="position" className="text-xs font-medium">
                  Position / Category *
                </Label>
                {categories.length === 0 ? (
                  <div className="h-10 px-3 rounded-lg border border-dashed bg-muted/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      No categories available
                    </span>
                  </div>
                ) : (
                  <Select
                    value={formData.position}
                    onValueChange={(value) =>
                      setFormData({ ...formData, position: value })
                    }
                  >
                    <SelectTrigger className="h-10 bg-background text-sm">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Position must match one of the session&apos;s voting
                  categories
                </p>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Candidate Photo
                </Label>

                {/* Image Preview - Facebook Style */}
                {formData.photo_url ? (
                  <div className="relative w-full aspect-square max-w-xs mx-auto rounded-xl overflow-hidden border-2 border-border bg-muted shadow-sm hover:shadow-md transition-shadow">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.photo_url}
                      alt={formData.name || "Candidate"}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() =>
                        setFormData({ ...formData, photo_url: "" })
                      }
                      className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full aspect-square max-w-xs mx-auto rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex items-center justify-center">
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">
                        No image uploaded
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload and URL Input */}
                <div className="space-y-2">
                  {/* Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handlePhotoUpload(
                            e as unknown as React.ChangeEvent<HTMLInputElement>
                          );
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="h-8 text-xs w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1.5" />
                        Upload from Device
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  {/* URL Input with Live Preview */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Paste Image URL
                    </Label>
                    <Input
                      value={formData.photo_url}
                      onChange={(e) =>
                        setFormData({ ...formData, photo_url: e.target.value })
                      }
                      placeholder="https://example.com/photo.jpg"
                      className="h-8 bg-background text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a direct image URL for instant preview
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs font-medium">
                  Biography
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Brief background of the candidate (e.g., experience, achievements)"
                  rows={4}
                  className="bg-background resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Manifesto */}
              <div className="space-y-1.5">
                <Label htmlFor="manifesto" className="text-xs font-medium">
                  Manifesto / Campaign Message
                </Label>
                <Textarea
                  id="manifesto"
                  value={formData.manifesto}
                  onChange={(e) =>
                    setFormData({ ...formData, manifesto: e.target.value })
                  }
                  placeholder="Campaign promises and vision (what the candidate plans to achieve)"
                  rows={6}
                  className="bg-background resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.manifesto.length}/1000 characters
                </p>
              </div>
            </div>
          </Card>

          {/* Voting Stats (Read-only) */}
          {candidate.vote_count !== undefined && (
            <Card className="p-4 sm:p-6 border shadow-none bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Voting Statistics
              </h3>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Current Vote Count
                </span>
                <span className="text-2xl font-bold text-primary">
                  {candidate.vote_count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Vote count cannot be modified directly
              </p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-background border-t p-4 -mx-2 sm:-mx-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="h-10 flex-1 sm:flex-initial"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Cancel</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Button
              type="submit"
              className="h-10 flex-1"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Candidate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
