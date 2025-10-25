"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/store/useAuthStore";

interface SessionFormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  eligibility: {
    colleges: string[];
    departments: string[];
    levels: string[];
  };
  allow_off_campus_voting: boolean;
}

export default function CreateSessionPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SessionFormData>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    eligibility: {
      colleges: [],
      departments: [],
      levels: [],
    },
    allow_off_campus_voting: false,
  });

  // Available options (you can fetch these from API if needed)
  const colleges = ["Engineering", "Science", "Arts", "Medicine", "Law"];
  const departments = [
    "Computer Science",
    "Electrical Engineering",
    "Mathematics",
    "Physics",
    "Chemistry",
  ];
  const levels = ["100", "200", "300", "400", "500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create session");
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

  const handleEligibilityChange = (
    field: "colleges" | "departments" | "levels",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        [field]: prev.eligibility[field].includes(value)
          ? prev.eligibility[field].filter((item) => item !== value)
          : [...prev.eligibility[field], value],
      },
    }));
  };

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
                Create New Session
              </h1>
              <p className="text-sm text-muted-foreground">
                Set up a new voting session
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

          {/* Basic Information */}
          <Card className="p-6 border shadow-none">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  Session Title
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Student Union Election 2024"
                    required
                    className="pl-10 bg-background border-input"
                  />
                </div>
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
                  placeholder="Provide details about the voting session..."
                  rows={4}
                  className="bg-background border-input resize-none"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Campus, Online"
                    required
                    className="pl-10 bg-background border-input"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Schedule */}
          <Card className="p-6 border shadow-none">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Schedule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time */}
              <div className="space-y-2">
                <Label
                  htmlFor="start_time"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  Start Time
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="start_time"
                    name="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                    className="pl-10 bg-background border-input"
                  />
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label
                  htmlFor="end_time"
                  className="text-xs uppercase font-semibold text-muted-foreground"
                >
                  End Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="end_time"
                    name="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                    className="pl-10 bg-background border-input"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Eligibility */}
          <Card className="p-6 border shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Eligibility Criteria
              </h2>
            </div>

            <div className="space-y-4">
              {/* Colleges */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">
                  Eligible Colleges
                </Label>
                <div className="flex flex-wrap gap-2">
                  {colleges.map((college) => (
                    <button
                      key={college}
                      type="button"
                      onClick={() =>
                        handleEligibilityChange("colleges", college)
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.eligibility.colleges.includes(college)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {college}
                    </button>
                  ))}
                </div>
                {formData.eligibility.colleges.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Select at least one college or leave empty for all
                  </p>
                )}
              </div>

              {/* Departments */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">
                  Eligible Departments
                </Label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((department) => (
                    <button
                      key={department}
                      type="button"
                      onClick={() =>
                        handleEligibilityChange("departments", department)
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.eligibility.departments.includes(department)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
                {formData.eligibility.departments.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Select at least one department or leave empty for all
                  </p>
                )}
              </div>

              {/* Levels */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">
                  Eligible Levels
                </Label>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleEligibilityChange("levels", level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.eligibility.levels.includes(level)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Level {level}
                    </button>
                  ))}
                </div>
                {formData.eligibility.levels.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Select at least one level or leave empty for all
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Voting Options */}
          <Card className="p-6 border shadow-none">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Voting Options
            </h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allow_off_campus_voting"
                name="allow_off_campus_voting"
                checked={formData.allow_off_campus_voting}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <div>
                <Label
                  htmlFor="allow_off_campus_voting"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Allow Off-Campus Voting
                </Label>
                <p className="text-xs text-muted-foreground">
                  Students can vote from any location
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
