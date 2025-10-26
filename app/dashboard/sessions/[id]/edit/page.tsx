"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  Loader2,
  Plus,
  X,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { UpdateSessionDto, Location as SessionLocation } from "@/types/session";
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
  _id?: string;
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
  eligible_colleges: string[];
  eligible_departments: string[];
  eligible_levels: string[];
  categories: string[];
  is_off_campus_allowed: boolean;
  results_public: boolean;
  candidates: Candidate[];
}

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const { token } = useAuthStore();
  const { colleges: collegesData, fetchColleges } = useCollegeStore();
  const { currentSession, fetchSessionById, updateSession } = useSessionStore();

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
      radius_meters: 5000,
    },
    eligible_colleges: [],
    eligible_departments: [],
    eligible_levels: [],
    categories: [],
    is_off_campus_allowed: false,
    results_public: false,
    candidates: [],
  });

  // Fetch session data and colleges on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        if (token) {
          await Promise.all([
            fetchSessionById(sessionId),
            fetchColleges(token),
          ]);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load session data");
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [token, sessionId, fetchSessionById, fetchColleges]);

  // Populate form when session data is loaded
  useEffect(() => {
    if (currentSession && collegesData && collegesData.length > 0) {
      console.log("Loading session data:", {
        colleges: currentSession.eligible_colleges,
        departments: currentSession.eligible_departments,
        levels: currentSession.eligible_levels,
      });

      setFormData({
        title: currentSession.title || "",
        description: currentSession.description || "",
        start_time: currentSession.start_time
          ? new Date(currentSession.start_time).toISOString().slice(0, 16)
          : "",
        end_time: currentSession.end_time
          ? new Date(currentSession.end_time).toISOString().slice(0, 16)
          : "",
        location: {
          lat: currentSession.location?.coordinates?.latitude || 7.62024,
          lng: currentSession.location?.coordinates?.longitude || 4.202455,
          radius_meters:
            currentSession.location?.radius_meters ||
            currentSession.geofence_radius ||
            5000,
        },
        eligible_colleges: Array.isArray(currentSession.eligible_colleges)
          ? currentSession.eligible_colleges
          : currentSession.eligible_college
          ? [currentSession.eligible_college]
          : [],
        eligible_departments: currentSession.eligible_departments || [],
        eligible_levels: currentSession.eligible_levels || [],
        categories: Array.isArray(currentSession.categories)
          ? currentSession.categories.map((c) =>
              typeof c === "string" ? c : c.name
            )
          : [],
        is_off_campus_allowed: currentSession.is_off_campus_allowed || false,
        results_public: currentSession.results_public || false,
        candidates:
          currentSession.candidates?.map((c) => ({
            _id: c._id, // Preserve the candidate ID
            name: c.name || "",
            position: c.position || "",
            photo_url: c.photo_url || "",
            bio: c.bio || "",
            manifesto: c.manifesto || "",
          })) || [],
      });
    }
  }, [currentSession, collegesData]);

  // Update colleges and departments when collegesData changes
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

      // Transform formData to match API expectations
      const updateData: UpdateSessionDto = {
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: {
          lat: formData.location.lat,
          lng: formData.location.lng,
          radius_meters: formData.location.radius_meters,
        } as SessionLocation,
        categories: formData.categories,
        eligible_colleges: Array.from(eligibleCollegesSet),
        eligible_departments: formData.eligible_departments,
        eligible_levels: formData.eligible_levels,
        is_off_campus_allowed: formData.is_off_campus_allowed,
        results_public: formData.results_public,
        // Note: Candidates are updated separately via /api/admin/candidates/:id
      };

      await updateSession(sessionId, updateData);
      // Refetch to ensure we have the latest data
      await fetchSessionById(sessionId);
      router.push(`/dashboard/sessions/${sessionId}`);
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
      eligible_levels: [],
    }));
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
      setFormData((prev) => ({
        ...prev,
        eligible_departments: selectedCollegeDepartments.map((d) => d._id),
        eligible_levels: [],
      }));
    }
  };

  const handleLevelChange = (level: string) => {
    const newLevels = formData.eligible_levels.includes(level)
      ? formData.eligible_levels.filter((l) => l !== level)
      : [...formData.eligible_levels, level];

    setFormData((prev) => ({
      ...prev,
      eligible_levels: newLevels,
    }));
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Session not found</p>
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
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Edit Session
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Update voting session details
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
                  placeholder="Describe this voting session..."
                  rows={3}
                  className="bg-background resize-none text-sm"
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

          {/* Eligibility Criteria */}
          <Card className="p-4 border shadow-none">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Eligibility Criteria
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

              {/* Off-Campus Voting */}
              <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_off_campus_allowed"
                  name="is_off_campus_allowed"
                  checked={formData.is_off_campus_allowed}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-input"
                />
                <Label
                  htmlFor="is_off_campus_allowed"
                  className="text-xs font-medium cursor-pointer"
                >
                  Allow off-campus voting (students can vote from anywhere)
                </Label>
              </div>

              {/* Results Public */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="results_public"
                  name="results_public"
                  checked={formData.results_public}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-input"
                />
                <Label
                  htmlFor="results_public"
                  className="text-xs font-medium cursor-pointer"
                >
                  Make results public after voting ends
                </Label>
              </div>
            </div>
          </Card>

          {/* Candidates */}
          <Card className="p-4 border shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Candidates
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formData.candidates.length} candidate
                  {formData.candidates.length !== 1 ? "s" : ""} registered
                </span>
              </div>
            </div>

            {formData.candidates.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-1">
                  No candidates registered yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {formData.candidates.map((candidate, index) => (
                  <div
                    key={candidate._id || index}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
                  >
                    {candidate.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={candidate.photo_url}
                        alt={candidate.name}
                        className="w-16 h-16 rounded-full object-cover border-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="text-sm font-medium truncate">
                        {candidate.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {candidate.position}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
              💡 <strong>Note:</strong> To edit candidates, go to the session
              details page after saving these changes.
            </p>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-background border-t p-4">
            <Button
              type="submit"
              className="w-full h-10 font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Update Session
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
