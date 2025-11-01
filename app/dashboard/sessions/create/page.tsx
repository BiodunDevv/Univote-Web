"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Calendar, Users, FileText, Loader2, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/College";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import CandidateForm from "@/components/CandidateForm";
import {
  CollegeQuickSelect,
  DepartmentSelector,
  LevelSelector,
} from "@/components/SessionForm";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl border-2 border-border bg-muted flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-xs text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

interface Department {
  _id: string;
  name: string;
  code: string;
  collegeName?: string; // Optional: for display purposes
}

interface Candidate {
  name: string;
  position: string;
  photo_url: string;
  bio: string;
  manifesto: string;
  uploading?: boolean;
}

interface SessionFormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: {
    lat: number;
    lng: number;
    radius_meters: number;
  };
  eligible_colleges: string[]; // Changed to array for multiple selection
  eligible_departments: string[];
  eligible_levels: string[];
  categories: string[];
  is_off_campus_allowed: boolean;
  candidates: Candidate[];
}

export default function CreateSessionPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { colleges: collegesData, fetchColleges } = useCollegeStore();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [selectedCollegeDepartments, setSelectedCollegeDepartments] = useState<
    Department[]
  >([]);

  const [formData, setFormData] = useState<SessionFormData>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: {
      lat: 7.62024,
      lng: 4.202455,
      radius_meters: 2000,
    },
    eligible_colleges: [], // Changed to array
    eligible_departments: [],
    eligible_levels: [],
    categories: [],
    is_off_campus_allowed: false,
    candidates: [],
  });

  // Fetch colleges and departments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        if (token) {
          await fetchColleges(token);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load colleges and departments");
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [token, fetchColleges]);

  // Update departments when collegesData changes - show ALL departments
  useEffect(() => {
    if (collegesData && collegesData.length > 0) {
      // Show ALL departments from ALL colleges
      const allDepartments: Department[] = [];
      collegesData.forEach((college) => {
        if (college.departments) {
          college.departments.forEach((d) => {
            if (!allDepartments.find((dept) => dept._id === d._id)) {
              allDepartments.push({
                _id: d._id,
                name: d.name,
                code: d.code,
                collegeName: college.name, // Add college name for display
              });
            }
          });
        }
      });
      setSelectedCollegeDepartments(allDepartments);
    }
  }, [collegesData]);

  // Update levels when departments change
  useEffect(() => {
    if (formData.eligible_departments.length > 0 && collegesData) {
      const levelsSet = new Set<string>();
      formData.eligible_departments.forEach((deptId) => {
        collegesData.forEach((college) => {
          if (college.departments) {
            const dept = college.departments.find((d) => d._id === deptId);
            if (dept && dept.available_levels) {
              dept.available_levels.forEach((level: string) =>
                levelsSet.add(level)
              );
            }
          }
        });
      });
      setAvailableLevels(Array.from(levelsSet));
    } else {
      setAvailableLevels([]);
    }
  }, [formData.eligible_departments, collegesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Automatically derive eligible_colleges from selected departments
      const eligibleCollegesSet = new Set<string>();
      formData.eligible_departments.forEach((deptId) => {
        collegesData.forEach((college) => {
          if (college.departments) {
            const hasDept = college.departments.some((d) => d._id === deptId);
            if (hasDept) {
              eligibleCollegesSet.add(college._id);
            }
          }
        });
      });

      const submitData = {
        ...formData,
        eligible_colleges: Array.from(eligibleCollegesSet),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/create-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      router.push("/dashboard/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCollegeCodeClick = (collegeId: string) => {
    // Get all departments for this college
    const college = collegesData.find((c) => c._id === collegeId);
    if (!college || !college.departments) return;

    const collegeDeptIds = college.departments.map((d) => d._id);

    // Check if all departments of this college are already selected
    const allCollegeDepstsSelected = collegeDeptIds.every((dId) =>
      formData.eligible_departments.includes(dId)
    );

    let newDepartments: string[];

    if (allCollegeDepstsSelected) {
      // Deselect all departments from this college
      newDepartments = formData.eligible_departments.filter(
        (dId) => !collegeDeptIds.includes(dId)
      );
    } else {
      // Select all departments from this college
      const existingDepts = new Set(formData.eligible_departments);
      collegeDeptIds.forEach((dId) => existingDepts.add(dId));
      newDepartments = Array.from(existingDepts);
    }

    setFormData((prev) => ({
      ...prev,
      eligible_departments: newDepartments,
    }));
  };

  const handleDepartmentChange = (deptId: string) => {
    const isSelected = formData.eligible_departments.includes(deptId);
    let newDepartments: string[];

    if (isSelected) {
      newDepartments = formData.eligible_departments.filter(
        (id) => id !== deptId
      );
    } else {
      newDepartments = [...formData.eligible_departments, deptId];
    }

    setFormData((prev) => ({
      ...prev,
      eligible_departments: newDepartments,
    }));
  };

  const handleSelectAllDepartments = () => {
    const allSelected =
      formData.eligible_departments.length ===
      selectedCollegeDepartments.length;

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        eligible_departments: [],
        eligible_levels: [],
      }));
    } else {
      const allDeptIds = selectedCollegeDepartments.map((d) => d._id);
      setFormData((prev) => ({
        ...prev,
        eligible_departments: allDeptIds,
      }));
    }
  };

  const handleLevelChange = (level: string) => {
    setFormData((prev) => ({
      ...prev,
      eligible_levels: prev.eligible_levels.includes(level)
        ? prev.eligible_levels.filter((l) => l !== level)
        : [...prev.eligible_levels, level],
    }));
  };

  const addCandidate = () => {
    setFormData((prev) => ({
      ...prev,
      candidates: [
        ...prev.candidates,
        {
          name: "",
          position: "",
          photo_url: "",
          bio: "",
          manifesto: "",
        },
      ],
    }));
  };

  const removeCandidate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index),
    }));
  };

  const updateCandidate = (
    index: number,
    field: keyof Candidate,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      candidates: prev.candidates.map((candidate, i) =>
        i === index ? { ...candidate, [field]: value } : candidate
      ),
    }));
  };

  const uploadCandidateImage = async (index: number, file: File) => {
    try {
      // Set uploading state
      updateCandidate(index, "uploading", true);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration is missing");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("cloud_name", cloudName);
      formData.append("folder", "univote/candidates");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      updateCandidate(index, "photo_url", data.secure_url);
      updateCandidate(index, "uploading", false);
    } catch (error) {
      console.error("Image upload error:", error);
      updateCandidate(index, "uploading", false);
      alert("Failed to upload image. Please try again.");
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Create New Session"
        subtitle="Set up a new voting session"
        onBack={() => router.push("/dashboard/sessions")}
      />

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
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Basic Information
            </h2>

            <div className="space-y-3">
              {/* Title */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="title"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Session Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Student Union Election 2024"
                  required
                  className="h-9 bg-background border-input text-sm"
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
                  placeholder="Provide details about the voting session..."
                  rows={3}
                  className="bg-background border-input resize-none text-sm"
                />
              </div>

              {/* Categories */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Voting Categories / Positions
                </Label>

                {/* Display Pills */}
                <div className="flex flex-wrap gap-1.5 min-h-10 p-2 bg-muted/30 rounded-lg border">
                  {formData.categories.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No categories added yet
                    </span>
                  ) : (
                    formData.categories.map((category, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                      >
                        <span>{category}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              categories: prev.categories.filter(
                                (_, i) => i !== index
                              ),
                            }));
                          }}
                          className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Category Input */}
                <div className="flex gap-2">
                  <Input
                    id="new-category"
                    placeholder="e.g., President, Vice President"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !formData.categories.includes(value)) {
                          setFormData((prev) => ({
                            ...prev,
                            categories: [...prev.categories, value],
                          }));
                          input.value = "";
                        }
                      }
                    }}
                    className="h-9 bg-background border-input text-sm flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById(
                        "new-category"
                      ) as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !formData.categories.includes(value)) {
                        setFormData((prev) => ({
                          ...prev,
                          categories: [...prev.categories, value],
                        }));
                        input.value = "";
                      }
                    }}
                    className="h-9 px-3 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Add positions one by one (e.g., President, Secretary). Press
                  Enter or click + to add
                </p>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="location"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Location Coordinates
                </Label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={formData.location.lat}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          location: { ...prev.location, lat: val },
                        }));
                      }}
                      className="h-9 bg-background border-input text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={formData.location.lng}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          location: { ...prev.location, lng: val },
                        }));
                      }}
                      className="h-9 bg-background border-input text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3 bg-muted/50 rounded-xl p-4 border">
                  <Label className="text-xs font-semibold text-foreground mb-3 block">
                    🎯 Voting Radius Control
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        const newRadius = Math.max(
                          500,
                          formData.location.radius_meters - 500
                        );
                        setFormData((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            radius_meters: newRadius,
                          },
                        }));
                      }}
                      className="h-10 w-10 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                    >
                      <span className="text-lg font-bold">−</span>
                    </Button>
                    <div className="flex-1 text-center">
                      <Input
                        type="number"
                        placeholder="Radius (meters)"
                        value={formData.location.radius_meters}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 5000;
                          setFormData((prev) => ({
                            ...prev,
                            location: { ...prev.location, radius_meters: val },
                          }));
                        }}
                        className="h-10 bg-background border-2 text-sm text-center font-bold rounded-xl shadow-sm"
                      />
                      <p className="text-xs font-medium text-muted-foreground mt-1.5">
                        {(formData.location.radius_meters / 1000).toFixed(2)}km
                        coverage area
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        const newRadius = formData.location.radius_meters + 500;
                        setFormData((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            radius_meters: newRadius,
                          },
                        }));
                      }}
                      className="h-10 w-10 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                    >
                      <span className="text-lg font-bold">+</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Students must be within this radius to vote • Adjustable in
                    500m increments
                  </p>
                </div>

                {/* Map Preview - Leaflet Interactive Map */}
                <div className="mt-3">
                  <MapComponent
                    lat={formData.location.lat}
                    lng={formData.location.lng}
                    radius={formData.location.radius_meters}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  🛰️ Interactive satellite view with accurate circular radius.
                  Red marker shows center, blue circle shows voting area.
                </p>
              </div>
            </div>
          </Card>

          {/* Schedule */}
          <Card className="p-4 border shadow-none">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Schedule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Start Time */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="start_time"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Start Time
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="h-9 bg-background border-input text-sm"
                />
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="end_time"
                  className="text-xs font-medium text-muted-foreground"
                >
                  End Time
                </Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="h-9 bg-background border-input text-sm"
                />
              </div>
            </div>
          </Card>

          {/* Eligibility */}
          <Card className="p-4 border shadow-none">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Eligibility Criteria (Step by Step)
            </h2>

            <div className="space-y-4">
              {/* Quick Select by College */}
              {collegesData && collegesData.length > 0 && (
                <CollegeQuickSelect
                  colleges={collegesData}
                  selectedDepartmentIds={formData.eligible_departments}
                  onCollegeClick={handleCollegeCodeClick}
                />
              )}

              {/* Step 1: Departments */}
              <DepartmentSelector
                colleges={collegesData}
                departments={selectedCollegeDepartments}
                selectedDepartmentIds={formData.eligible_departments}
                onDepartmentChange={handleDepartmentChange}
                onSelectAllDepartments={handleSelectAllDepartments}
                loading={false}
              />

              {/* Step 2: Levels */}
              <LevelSelector
                availableLevels={availableLevels}
                selectedLevels={formData.eligible_levels}
                selectedDepartmentsCount={formData.eligible_departments.length}
                onLevelChange={handleLevelChange}
              />
            </div>
          </Card>

          {/* Voting Options */}
          <Card className="p-4 border shadow-none">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Voting Options
            </h2>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="is_off_campus_allowed"
                name="is_off_campus_allowed"
                checked={formData.is_off_campus_allowed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_off_campus_allowed: e.target.checked,
                  })
                }
                className="w-4 h-4 mt-0.5 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <div className="flex-1">
                <Label
                  htmlFor="is_off_campus_allowed"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Allow Off-Campus Voting
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Students can vote from any location
                </p>
              </div>
            </div>
          </Card>

          {/* Candidates */}
          <Card className="p-4 border shadow-none">
            <CandidateForm
              candidates={formData.candidates}
              categories={formData.categories}
              onAddCandidate={addCandidate}
              onRemoveCandidate={removeCandidate}
              onUpdateCandidate={updateCandidate}
              onUploadImage={uploadCandidateImage}
            />
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/sessions")}
              disabled={loading}
              className="h-9 px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-4 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
