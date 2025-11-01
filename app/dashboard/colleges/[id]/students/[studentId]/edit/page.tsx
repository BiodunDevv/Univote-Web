"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  User,
  Mail,
  GraduationCap,
  Building2,
  Hash,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import { useStudentStore } from "@/lib/store/useStudentStore";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const studentId = params.studentId as string;

  const { token, admin } = useAuthStore();
  const { currentCollege, fetchCollegeById } = useCollegeStore();
  const { currentStudent, loading, error, fetchStudentById, updateStudent } =
    useStudentStore();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: "",
    college: "",
    level: "",
    photo_url: "",
    is_active: true,
  });
  const [updateWarning, setUpdateWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = admin?.role === "super_admin";

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      router.push(`/dashboard/colleges/${collegeId}/students`);
    }
  }, [isSuperAdmin, router, collegeId]);

  // Load college and student data
  useEffect(() => {
    if (collegeId) {
      fetchCollegeById(token || undefined, collegeId);
    }
    if (studentId) {
      fetchStudentById(token || undefined, studentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, studentId]);

  // Populate form when student data is loaded
  useEffect(() => {
    if (currentStudent) {
      setFormData({
        full_name: currentStudent.full_name || "",
        email: currentStudent.email || "",
        department: currentStudent.department || "",
        college: currentStudent.college || "",
        level: currentStudent.level || "",
        photo_url: currentStudent.photo_url || "",
        is_active: currentStudent.is_active ?? true,
      });
      setPreviewUrl(currentStudent.photo_url || null);
    }
  }, [currentStudent]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
      );
      formDataUpload.append("folder", "univote/students");

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      setFormData({ ...formData, photo_url: imageUrl });
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, photo_url: "" });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const result = await updateStudent(token, studentId, formData);
      if (result.warning) {
        setUpdateWarning(result.warning);
        // Still show success but with warning
        setTimeout(() => {
          router.push(`/dashboard/colleges/${collegeId}/students`);
        }, 3000);
      } else {
        router.push(`/dashboard/colleges/${collegeId}/students`);
      }
    } catch {
      // Error handled by store
    }
  };

  if (loading && !currentStudent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border shadow-none text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Student not found
          </h3>
          <Button
            onClick={() =>
              router.push(`/dashboard/colleges/${collegeId}/students`)
            }
          >
            Back to Students
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push(`/dashboard/colleges/${collegeId}/students`)
              }
              className="rounded-full hover:bg-accent h-9 w-9"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Edit Student
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentStudent.matric_no} - {currentStudent.full_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error Message */}
          {error && (
            <Card className="p-3 border-destructive/50 bg-destructive/5 shadow-none">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-xs text-destructive/80">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Warning Message */}
          {updateWarning && (
            <Card className="p-3 border-orange-500/50 bg-orange-500/5 shadow-none">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    Update Warning
                  </p>
                  <p className="text-xs text-orange-700">{updateWarning}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Redirecting in 3 seconds...
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Student Information */}
          <Card className="p-4 border shadow-none">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              Student Information
            </h3>

            <div className="space-y-3">
              {/* Matric Number (Read-only) */}
              <div>
                <Label className="flex items-center gap-2 mb-1.5 text-xs">
                  <Hash className="w-3.5 h-3.5" />
                  Matric Number
                </Label>
                <Input
                  value={currentStudent.matric_no}
                  disabled
                  className="bg-muted font-mono h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Matric number cannot be changed
                </p>
              </div>

              {/* Full Name */}
              <div>
                <Label className="flex items-center gap-2 mb-1.5 text-xs">
                  <User className="w-3.5 h-3.5" />
                  Full Name *
                </Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  placeholder="Enter full name"
                  className="h-9 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <Label className="flex items-center gap-2 mb-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5" />
                  Email *
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="Enter email address"
                  className="h-9 text-sm"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="flex items-center gap-2 mb-2 text-xs">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Profile Photo
                </Label>

                <div className="space-y-3">
                  {/* Preview */}
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Upload Button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        asChild
                      >
                        <span>
                          {uploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 mr-2" />
                              {previewUrl ? "Change Photo" : "Upload Photo"}
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {/* Info text */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Recommended: Square image, at least 400x400px
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max file size: 5MB (JPG, PNG, WEBP)
                    </p>
                    <p className="text-xs text-orange-600">
                      ⚠️ Updating photo will re-register facial recognition
                      (Face++)
                    </p>
                    {currentStudent.has_facial_data && (
                      <p className="text-xs text-green-600">
                        ✓ Facial data currently registered
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Academic Information */}
          <Card className="p-4 border shadow-none">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4" />
              Academic Information
            </h3>

            <div className="space-y-3">
              {/* College */}
              <div>
                <Label className="flex items-center gap-2 mb-1.5 text-xs">
                  <Building2 className="w-3.5 h-3.5" />
                  College *
                </Label>
                <Input
                  value={formData.college}
                  disabled
                  className="bg-muted h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  College cannot be changed from this page
                </p>
              </div>

              {/* Department */}
              <div>
                <Label className="flex items-center gap-2 mb-1.5 text-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Department *
                </Label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  required
                  className="w-full px-3 h-9 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select department</option>
                  {currentCollege?.departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <Label className="mb-1.5 text-xs">Level *</Label>
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: e.target.value })
                  }
                  required
                  className="w-full px-3 h-9 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select level</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                  <option value="600">600</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Status */}
          <Card className="p-4 border shadow-none">
            <h3 className="font-semibold text-foreground mb-3 text-sm">
              Status
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active === true}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300"
              />
              <div>
                <Label htmlFor="is_active" className="cursor-pointer text-sm">
                  Active Student
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive students cannot login or vote
                </p>
              </div>
            </div>
          </Card>

          {/* Additional Info */}
          {currentStudent.first_login && (
            <Card className="p-3 border shadow-none bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    First Login Pending
                  </p>
                  <p className="text-xs text-blue-700">
                    This student has not logged in yet and will be required to
                    change their password on first login.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1 h-10">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                router.push(`/dashboard/colleges/${collegeId}/students`)
              }
              className="h-10"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
