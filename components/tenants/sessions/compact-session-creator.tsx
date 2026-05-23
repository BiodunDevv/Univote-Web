"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  FileText,
  MapPin,
  Users,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  isTenantEligibilityDimensionEnabled,
  getTenantParticipantLabels,
} from "@/lib/tenant-config";
import {
  SessionCreationCollege,
  SessionCreationFormData,
  deriveAllDepartments,
  deriveEligibleColleges,
  deriveAvailableLevels,
  validateFullSessionCreationWithOptions,
} from "@/components/tenants/sessions/create";
import { createEmptySessionFormData } from "@/components/tenants/sessions/session-form-utils";
import {
  CollegeQuickSelect,
  DepartmentSelector,
  LevelSelector,
} from "@/components/tenants/sessions/form";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

interface CompactSessionCreatorProps {
  colleges: SessionCreationCollege[];
  onSubmit: (
    formData: SessionCreationFormData,
    eligibleCollegeIds: string[],
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CompactSessionCreator({
  colleges,
  onSubmit,
  onCancel,
  isSubmitting,
}: CompactSessionCreatorProps) {
  const { tenant } = useAuthStore();
  const participantLabels = getTenantParticipantLabels(tenant);
  const collegeEligibilityEnabled = isTenantEligibilityDimensionEnabled(
    tenant,
    "college",
  );
  const departmentEligibilityEnabled = isTenantEligibilityDimensionEnabled(
    tenant,
    "department",
  );
  const levelEligibilityEnabled = isTenantEligibilityDimensionEnabled(
    tenant,
    "level",
  );

  const [formData, setFormData] = useState<SessionCreationFormData>(
    createEmptySessionFormData(),
  );
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const allDepartments = useMemo(
    () => deriveAllDepartments(colleges),
    [colleges],
  );
  const availableLevels = useMemo(
    () =>
      deriveAvailableLevels(
        formData.eligible_departments,
        colleges,
        formData.eligible_college,
      ),
    [colleges, formData.eligible_college, formData.eligible_departments],
  );

  const eligibleCollegeIds = useMemo(
    () =>
      formData.eligible_college
        ? [formData.eligible_college]
        : deriveEligibleColleges(formData.eligible_departments, colleges),
    [colleges, formData.eligible_college, formData.eligible_departments],
  );

  const validationIssues = useMemo(
    () =>
      validateFullSessionCreationWithOptions(formData, {
        departmentEligibilityEnabled,
        collegeEligibilityEnabled,
        levelEligibilityEnabled,
      }),
    [
      collegeEligibilityEnabled,
      departmentEligibilityEnabled,
      formData,
      levelEligibilityEnabled,
    ],
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = () => {
    if (
      !categoryInput.trim() ||
      formData.categories.includes(categoryInput.trim())
    )
      return;
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, categoryInput.trim()],
    }));
    setCategoryInput("");
  };

  const handleRemoveCategory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  };

  const handleLocationChange = (
    field: "lat" | "lng" | "radius_meters",
    value: number,
  ) => {
    if (!Number.isFinite(value)) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (validationIssues.length > 0) {
      setShowValidationErrors(true);
      return;
    }
    setConfirmSubmit(true);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Create Voting Session
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up a new session in minutes. Quick and easy.
        </p>
      </div>

      {/* Session Basics */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Session Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium">
                Election Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Leadership Election 2026"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Voting Categories *</Label>
              <div className="flex gap-1">
                <Input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="e.g., President"
                  className="h-9 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddCategory}
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.categories.map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(i)}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Explain what this election is about"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-primary" />
            Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start_time" className="text-xs font-medium">
                Start Date & Time *
              </Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={handleInputChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time" className="text-xs font-medium">
                End Date & Time *
              </Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={handleInputChange}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Location & Geofence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat" className="text-xs font-medium">
                Latitude
              </Label>
              <Input
                id="lat"
                type="number"
                step="0.000001"
                value={formData.location.lat}
                onChange={(e) =>
                  handleLocationChange("lat", parseFloat(e.target.value))
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng" className="text-xs font-medium">
                Longitude
              </Label>
              <Input
                id="lng"
                type="number"
                step="0.000001"
                value={formData.location.lng}
                onChange={(e) =>
                  handleLocationChange("lng", parseFloat(e.target.value))
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="radius" className="text-xs font-medium">
                Radius (meters)
              </Label>
              <Input
                id="radius"
                type="number"
                value={formData.location.radius_meters}
                onChange={(e) =>
                  handleLocationChange(
                    "radius_meters",
                    parseInt(e.target.value),
                  )
                }
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 rounded-lg overflow-hidden border">
            <MapComponent
              lat={formData.location.lat}
              lng={formData.location.lng}
              radius={formData.location.radius_meters}
            />
          </div>
          <Label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox
              checked={formData.is_off_campus_allowed}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  is_off_campus_allowed: checked === true,
                }))
              }
            />
            Allow off-campus voting
          </Label>
        </CardContent>
      </Card>

      {/* Eligibility */}
      {(collegeEligibilityEnabled ||
        departmentEligibilityEnabled ||
        levelEligibilityEnabled) && (
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Who Can Vote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {collegeEligibilityEnabled && (
              <CollegeQuickSelect
                colleges={colleges}
                selectedCollegeId={formData.eligible_college}
                selectedDepartmentIds={formData.eligible_departments}
                onCollegeClick={(collegeId) =>
                  setFormData((prev) => ({
                    ...prev,
                    eligible_college: collegeId,
                  }))
                }
                departmentMode={departmentEligibilityEnabled}
                participantPluralLabel={participantLabels.plural}
              />
            )}

            {departmentEligibilityEnabled && (
              <DepartmentSelector
                colleges={colleges}
                departments={allDepartments}
                selectedDepartmentIds={formData.eligible_departments}
                onDepartmentChange={(deptId) =>
                  setFormData((prev) => ({
                    ...prev,
                    eligible_departments: prev.eligible_departments.includes(
                      deptId,
                    )
                      ? prev.eligible_departments.filter((d) => d !== deptId)
                      : [...prev.eligible_departments, deptId],
                  }))
                }
                onSelectAllDepartments={() =>
                  setFormData((prev) => ({
                    ...prev,
                    eligible_departments: allDepartments.map((d) => d._id),
                  }))
                }
                loading={false}
              />
            )}

            {levelEligibilityEnabled && (
              <LevelSelector
                availableLevels={availableLevels}
                selectedLevels={formData.eligible_levels}
                selectionCount={formData.eligible_departments.length}
                selectionRequiredLabel="Select levels"
                emptySelectionMessage="Select at least one level"
                onLevelChange={(level: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    eligible_levels: prev.eligible_levels.includes(level)
                      ? prev.eligible_levels.filter((l) => l !== level)
                      : [...prev.eligible_levels, level],
                  }))
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {showValidationErrors && validationIssues.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                Please fix these issues before creating the election:
              </p>
              <ul className="text-sm text-red-800 dark:text-red-300 list-disc list-inside space-y-0.5">
                {validationIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Election"}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogTitle>Create Election?</AlertDialogTitle>
          <AlertDialogDescription>
            You're about to create a voting election with the following details:
            <ul className="mt-3 space-y-1 text-sm text-foreground ml-4 list-disc">
              <li>
                <strong>{formData.title}</strong>
              </li>
              <li>
                {formData.categories.length} categories:{" "}
                {formData.categories.join(", ")}
              </li>
              <li>Geofence: {formData.location.radius_meters}m radius</li>
            </ul>
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await onSubmit(formData, eligibleCollegeIds);
                } catch (error) {
                  console.error("Failed to create election:", error);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
