"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
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

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const deptId = params.deptId as string;

  const { token, admin } = useAuthStore();
  const { currentCollege, loading, error, fetchCollegeById, updateDepartment } =
    useCollegeStore();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    hod_name: "",
    hod_email: "",
    available_levels: [] as string[],
    is_active: true,
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

  // Find and load the department
  const department = currentCollege?.departments.find((d) => d._id === deptId);

  // Update form when department data changes
  if (
    department &&
    (formData.name !== department.name || formData.code !== department.code)
  ) {
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || "",
      hod_name: department.hod_name || "",
      hod_email: department.hod_email || "",
      available_levels: department.available_levels || [],
      is_active: department.is_active,
    });
  }

  const availableLevelOptions = [
    { value: "100", label: "100" },
    { value: "200", label: "200" },
    { value: "300", label: "300" },
    { value: "400", label: "400" },
    { value: "500", label: "500" },
    { value: "600", label: "600" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleLevel = (level: string) => {
    setFormData((prev) => ({
      ...prev,
      available_levels: prev.available_levels.includes(level)
        ? prev.available_levels.filter((l) => l !== level)
        : [...prev.available_levels, level].sort(),
    }));
  };

  const toggleStatus = () => {
    setFormData((prev) => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await updateDepartment(token, collegeId, deptId, formData);
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

  if (!currentCollege || !department) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border shadow-none text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Department not found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            The department you&apos;re trying to edit doesn&apos;t exist.
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
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:bg-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Edit Department
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentCollege.name} - Update department information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Department Information */}
          <Card className="p-6 border shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  Department Information
                </h2>
              </div>

              {/* Status Toggle */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleStatus}
                className={
                  formData.is_active ? "border-green-600" : "border-gray-400"
                }
              >
                {formData.is_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-600">Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-gray-600">Inactive</span>
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {/* Department Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  Department Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science"
                  required
                  className="bg-background border-input"
                />
              </div>

              {/* Department Code */}
              <div className="space-y-2">
                <Label
                  htmlFor="code"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  Department Code
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., CSC"
                  required
                  className="bg-background border-input uppercase"
                  maxLength={6}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the department..."
                  rows={3}
                  className="bg-background border-input resize-none"
                />
              </div>

              {/* Available Levels */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">
                  Available Levels
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableLevelOptions.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => toggleLevel(level.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.available_levels.includes(level.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Level {level.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which levels are offered in this department
                </p>
              </div>
            </div>
          </Card>

          {/* HOD Information */}
          <Card className="p-6 border shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Head of Department (HOD)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HOD Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="hod_name"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  HOD Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="hod_name"
                    name="hod_name"
                    value={formData.hod_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Dr. Jane Smith"
                    className="pl-10 bg-background border-input"
                  />
                </div>
              </div>

              {/* HOD Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="hod_email"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  HOD Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="hod_email"
                    name="hod_email"
                    type="email"
                    value={formData.hod_email}
                    onChange={handleInputChange}
                    placeholder="hod@bowenuniversity.edu.ng"
                    className="pl-10 bg-background border-input"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Card */}
          <Card className="p-6 border shadow-none bg-secondary/20">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Department Statistics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground">
                  College
                </Label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {currentCollege.name} ({currentCollege.code})
                </p>
              </div>
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground">
                  Students Enrolled
                </Label>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {department.student_count}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="hover:bg-accent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-32">
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
