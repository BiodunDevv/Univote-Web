"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";

export default function EditCollegePage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;

  const { token, admin } = useAuthStore();
  const { currentCollege, loading, error, fetchCollegeById, updateCollege } =
    useCollegeStore();

  const [formData, setFormData] = useState({
    name: currentCollege?.name || "",
    code: currentCollege?.code || "",
    description: currentCollege?.description || "",
    dean_name: currentCollege?.dean_name || "",
    dean_email: currentCollege?.dean_email || "",
    is_active: currentCollege?.is_active ?? true,
  });

  const isSuperAdmin = admin?.role === "super_admin";

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      router.push("/dashboard/colleges");
    }
  }, [isSuperAdmin, router]);

  useEffect(() => {
    if (collegeId) {
      fetchCollegeById(token || undefined, collegeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  // Update form when college data loads
  useEffect(() => {
    if (currentCollege) {
      setFormData({
        name: currentCollege.name,
        code: currentCollege.code,
        description: currentCollege.description || "",
        dean_name: currentCollege.dean_name || "",
        dean_email: currentCollege.dean_email || "",
        is_active: currentCollege.is_active,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCollege?._id]); // Only update when college ID changes

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStatus = () => {
    setFormData((prev) => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await updateCollege(token, collegeId, formData);
      router.push(`/dashboard/colleges/${collegeId}`);
    } catch {
      // Error handled by store
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  if (loading && !currentCollege) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentCollege) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border shadow-none text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            College not found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            The college you&apos;re trying to edit doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/dashboard/colleges")}>
            Back to Colleges
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 rounded-full hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Edit College
              </h1>
              <p className="text-xs text-muted-foreground">
                Update college information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* College Information */}
          <Card className="p-4 border shadow-none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  College Information
                </h2>
              </div>

              {/* Status Toggle */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleStatus}
                className={`h-8 ${
                  formData.is_active ? "border-green-600" : "border-gray-400"
                }`}
              >
                {formData.is_active ? (
                  <>
                    <ToggleRight className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                    <span className="text-xs text-green-600">Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                    <span className="text-xs text-gray-600">Inactive</span>
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              {/* College Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  College Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., College of Computing and Communication Studies"
                  required
                  className="h-9 bg-background border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* College Code */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="code"
                  className="text-xs font-medium text-muted-foreground"
                >
                  College Code
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    setFormData((prev) => ({
                      ...prev,
                      [name]: value.toUpperCase(),
                    }));
                  }}
                  placeholder="e.g., COCCS"
                  required
                  className="h-9 bg-background border-input uppercase text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={10}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the college..."
                  rows={3}
                  className="bg-background border-input resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Card>

          {/* Dean Information */}
          <Card className="p-4 border shadow-none">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Dean Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Dean Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="dean_name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Dean Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="dean_name"
                    name="dean_name"
                    value={formData.dean_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Prof. John Doe"
                    className="pl-9 h-9 bg-background border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Dean Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="dean_email"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Dean Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="dean_email"
                    name="dean_email"
                    type="email"
                    value={formData.dean_email}
                    onChange={handleInputChange}
                    placeholder="dean@bowenuniversity.edu.ng"
                    className="pl-9 h-9 bg-background border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Card */}
          <Card className="p-4 border shadow-none bg-secondary/20">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                College Statistics
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Departments
                </Label>
                <p className="text-xl font-semibold text-foreground mt-1">
                  {currentCollege.departments.length}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Students
                </Label>
                <p className="text-xl font-semibold text-foreground mt-1">
                  {currentCollege.student_count}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Note: To manage departments, go to the college detail page
            </p>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="h-10 hover:bg-accent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-10 min-w-32">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
