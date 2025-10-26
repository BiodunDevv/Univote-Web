"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Plus,
  X,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";

interface DepartmentForm {
  name: string;
  code: string;
  description: string;
  hod_name: string;
  hod_email: string;
  available_levels: string[];
}

export default function CreateCollegePage() {
  const router = useRouter();
  const { token, admin } = useAuthStore();
  const { createCollege, loading, error } = useCollegeStore();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    dean_name: "",
    dean_email: "",
  });

  const [departments, setDepartments] = useState<DepartmentForm[]>([]);

  // Check if user is super admin
  if (admin?.role !== "super_admin") {
    router.push("/dashboard/colleges");
    return null;
  }

  const availableLevelOptions = [
    { value: "100", label: "Level 100" },
    { value: "200", label: "Level 200" },
    { value: "300", label: "Level 300" },
    { value: "400", label: "Level 400" },
    { value: "500", label: "Level 500" },
    { value: "600", label: "Level 600" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addDepartment = () => {
    setDepartments((prev) => [
      ...prev,
      {
        name: "",
        code: "",
        description: "",
        hod_name: "",
        hod_email: "",
        available_levels: ["100", "200", "300", "400"],
      },
    ]);
  };

  const removeDepartment = (index: number) => {
    setDepartments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDepartment = (
    index: number,
    field: string,
    value: string | string[]
  ) => {
    setDepartments((prev) =>
      prev.map((dept, i) => (i === index ? { ...dept, [field]: value } : dept))
    );
  };

  const toggleLevel = (deptIndex: number, level: string) => {
    setDepartments((prev) =>
      prev.map((dept, i) => {
        if (i === deptIndex) {
          const levels = dept.available_levels.includes(level)
            ? dept.available_levels.filter((l) => l !== level)
            : [...dept.available_levels, level];
          return { ...dept, available_levels: levels.sort() };
        }
        return dept;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    try {
      await createCollege(token, {
        ...formData,
        departments: departments.length > 0 ? departments : undefined,
      });
      router.push("/dashboard/colleges");
    } catch {
      // Error handled by store
    }
  };

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
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Create New College
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Add a new college to the system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <Card className="p-4 border shadow-none">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                College Information
              </h2>
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
                  onChange={handleInputChange}
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

          {/* Departments */}
          <Card className="p-4 border shadow-none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Departments
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({departments.length})
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDepartment}
                className="h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Department
              </Button>
            </div>

            {departments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No departments added yet. You can add them later.
              </p>
            ) : (
              <div className="space-y-3">
                {departments.map((dept, index) => (
                  <div
                    key={index}
                    className="p-3 bg-secondary/50 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-xs text-foreground">
                        Department {index + 1}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDepartment(index)}
                        className="h-7 w-7 rounded-full p-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Department Name
                        </Label>
                        <Input
                          value={dept.name}
                          onChange={(e) =>
                            updateDepartment(index, "name", e.target.value)
                          }
                          placeholder="e.g., Computer Science"
                          required
                          className="h-9 bg-background text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Department Code
                        </Label>
                        <Input
                          value={dept.code}
                          onChange={(e) =>
                            updateDepartment(
                              index,
                              "code",
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="e.g., CSC"
                          required
                          className="h-9 bg-background uppercase text-sm"
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Description
                      </Label>
                      <Input
                        value={dept.description}
                        onChange={(e) =>
                          updateDepartment(index, "description", e.target.value)
                        }
                        placeholder="Brief description..."
                        className="h-9 bg-background text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          HOD Name
                        </Label>
                        <Input
                          value={dept.hod_name}
                          onChange={(e) =>
                            updateDepartment(index, "hod_name", e.target.value)
                          }
                          placeholder="e.g., Dr. Jane Smith"
                          className="h-9 bg-background text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          HOD Email
                        </Label>
                        <Input
                          value={dept.hod_email}
                          onChange={(e) =>
                            updateDepartment(index, "hod_email", e.target.value)
                          }
                          placeholder="hod@bowenuniversity.edu.ng"
                          type="email"
                          className="h-9 bg-background text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Available Levels
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {availableLevelOptions.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => toggleLevel(index, level.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              dept.available_levels.includes(level.value)
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  Creating...
                </>
              ) : (
                "Create College"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
