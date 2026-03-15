"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getTenantParticipantLabels,
  isTenantEligibilityDimensionEnabled,
} from "@/lib/tenant-config";
import {
  BasicInfoStep,
  CandidatesStep,
  EligibilityStep,
  ReviewSubmitStep,
  ScheduleLocationStep,
  SESSION_CREATION_STEPS,
  SessionCandidate,
  SessionCreationCollege,
  SessionCreationFormData,
  SessionCreationNavigation,
  SessionCreationStep,
  SessionCreationStepper,
  deriveAllDepartments,
  deriveAvailableLevels,
  deriveEligibleColleges,
  validateFullSessionCreationWithOptions,
  validateSessionStep,
} from "@/components/tenants/sessions/create";
import { CandidateMutationDto } from "@/types/session";

type SessionBuilderProps = {
  mode: "create" | "edit";
  title: string;
  description: string;
  colleges: SessionCreationCollege[];
  initialData: SessionCreationFormData;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (
    formData: SessionCreationFormData,
    eligibleCollegeIds: string[],
  ) => Promise<void>;
  onCreateCandidate?: (
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  onUpdateCandidate?: (
    candidateId: string,
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  onDeleteCandidate?: (candidateId: string) => Promise<void>;
};

export function SessionBuilder({
  mode,
  title,
  description,
  colleges,
  initialData,
  isSubmitting,
  onCancel,
  onSubmit,
  onCreateCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
}: SessionBuilderProps) {
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
  const [error, setError] = useState<string | null>(null);
  const [stepIssues, setStepIssues] = useState<string[]>([]);
  const [formData, setFormData] = useState<SessionCreationFormData>(initialData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<SessionCreationStep[]>(
    [],
  );

  const clearMessages = () => {
    setError(null);
    setStepIssues([]);
  };

  const currentStep = SESSION_CREATION_STEPS[currentStepIndex].id;

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

  const normalizedFormData = useMemo(
    () => ({
      ...formData,
      eligible_college: collegeEligibilityEnabled ? formData.eligible_college : null,
      eligible_departments: departmentEligibilityEnabled
        ? formData.eligible_departments
        : [],
      eligible_levels:
        levelEligibilityEnabled
          ? formData.eligible_levels.filter((level) =>
              availableLevels.includes(level),
            )
          : [],
    }),
    [
      availableLevels,
      collegeEligibilityEnabled,
      departmentEligibilityEnabled,
      formData,
      levelEligibilityEnabled,
    ],
  );

  const fullValidationIssues = useMemo(
    () =>
      validateFullSessionCreationWithOptions(normalizedFormData, {
        departmentEligibilityEnabled,
        collegeEligibilityEnabled,
        levelEligibilityEnabled,
      }),
    [
      collegeEligibilityEnabled,
      departmentEligibilityEnabled,
      levelEligibilityEnabled,
      normalizedFormData,
    ],
  );

  const updateFormData = (updater: (current: SessionCreationFormData) => SessionCreationFormData) => {
    setFormData((current) => updater(current));
    clearMessages();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    updateFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addCategory = (value: string) => {
    if (!value || formData.categories.includes(value)) return;
    updateFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, value],
    }));
  };

  const removeCategory = (index: number) => {
    updateFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateLocation = (
    field: "lat" | "lng" | "radius_meters",
    value: number,
  ) => {
    updateFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const updateDateTime = (field: "start_time" | "end_time", value: string) => {
    updateFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCollegeCodeClick = (collegeId: string) => {
    if (!departmentEligibilityEnabled) {
      updateFormData((prev) => ({
        ...prev,
        eligible_college: prev.eligible_college === collegeId ? null : collegeId,
      }));
      return;
    }

    const college = colleges.find((item) => item._id === collegeId);
    if (!college) return;

    const collegeDepartmentIds = college.departments.map((department) => department._id);
    const allSelected = collegeDepartmentIds.every((departmentId) =>
      formData.eligible_departments.includes(departmentId),
    );

    updateFormData((prev) => ({
      ...prev,
      eligible_college: null,
      eligible_departments: allSelected
        ? prev.eligible_departments.filter(
            (departmentId) => !collegeDepartmentIds.includes(departmentId),
          )
        : Array.from(
            new Set([...prev.eligible_departments, ...collegeDepartmentIds]),
          ),
    }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    updateFormData((prev) => ({
      ...prev,
      eligible_college: null,
      eligible_departments: prev.eligible_departments.includes(departmentId)
        ? prev.eligible_departments.filter((id) => id !== departmentId)
        : [...prev.eligible_departments, departmentId],
    }));
  };

  const handleSelectAllDepartments = () => {
    const everyDepartmentSelected =
      formData.eligible_departments.length === allDepartments.length;

    updateFormData((prev) => ({
      ...prev,
      eligible_college: null,
      eligible_departments: everyDepartmentSelected
        ? []
        : allDepartments.map((department) => department._id),
      eligible_levels: everyDepartmentSelected ? [] : prev.eligible_levels,
    }));
  };

  const handleLevelChange = (level: string) => {
    updateFormData((prev) => ({
      ...prev,
      eligible_levels: prev.eligible_levels.includes(level)
        ? prev.eligible_levels.filter((item) => item !== level)
        : [...prev.eligible_levels, level],
    }));
  };

  const goToNextStep = () => {
    const issues = validateSessionStep(currentStep, normalizedFormData, {
      departmentEligibilityEnabled,
      collegeEligibilityEnabled,
      levelEligibilityEnabled,
    });
    if (issues.length > 0) {
      setStepIssues(issues);
      setError("Please fix this step before continuing.");
      return;
    }

    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep],
    );
    setCurrentStepIndex((prev) =>
      Math.min(prev + 1, SESSION_CREATION_STEPS.length - 1),
    );
    clearMessages();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    const validationIssues = validateFullSessionCreationWithOptions(
      normalizedFormData,
      {
        collegeEligibilityEnabled,
        departmentEligibilityEnabled,
        levelEligibilityEnabled,
      },
    );
    if (validationIssues.length > 0) {
      setStepIssues(validationIssues);
      setError(
        mode === "create"
          ? "Resolve the highlighted issues before creating this session."
          : "Resolve the highlighted issues before updating this session.",
      );

      const firstInvalidStep = SESSION_CREATION_STEPS.find(
        (step) =>
          validateSessionStep(step.id, normalizedFormData, {
            departmentEligibilityEnabled,
            collegeEligibilityEnabled,
            levelEligibilityEnabled,
          }).length > 0,
      );
      if (firstInvalidStep) {
        setCurrentStepIndex(
          SESSION_CREATION_STEPS.findIndex((step) => step.id === firstInvalidStep.id),
        );
      }
      return;
    }

    try {
      await onSubmit(normalizedFormData, eligibleCollegeIds);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "create"
            ? "Failed to create session"
            : "Failed to update session",
      );
    }
  };

  const renderCurrentStep = () => {
    if (currentStep === "basic") {
      return (
        <BasicInfoStep
          formData={normalizedFormData}
          onInputChange={handleInputChange}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
        />
      );
    }

    if (currentStep === "schedule") {
      return (
        <ScheduleLocationStep
          formData={normalizedFormData}
          onDateTimeChange={updateDateTime}
          onLocationChange={updateLocation}
        />
      );
    }

    if (currentStep === "eligibility") {
      return (
        <EligibilityStep
          colleges={colleges}
          departments={allDepartments}
          availableLevels={availableLevels}
          formData={normalizedFormData}
          participantPluralLabel={participantLabels.plural}
          selectedCollegeId={normalizedFormData.eligible_college}
          collegeEligibilityEnabled={collegeEligibilityEnabled}
          departmentEligibilityEnabled={departmentEligibilityEnabled}
          levelEligibilityEnabled={levelEligibilityEnabled}
          onCollegeClick={handleCollegeCodeClick}
          onDepartmentChange={handleDepartmentChange}
          onSelectAllDepartments={handleSelectAllDepartments}
          onLevelChange={handleLevelChange}
          onToggleOffCampus={(value) =>
            updateFormData((prev) => ({
              ...prev,
              is_off_campus_allowed: value,
            }))
          }
        />
      );
    }

    if (currentStep === "candidates") {
      return (
        <CandidatesStep
          candidates={normalizedFormData.candidates}
          categories={normalizedFormData.categories}
          persistence={mode === "create" ? "local" : "remote"}
          canManage
          onCandidatesChange={(candidates) =>
            updateFormData((prev) => ({ ...prev, candidates }))
          }
          onCreateCandidate={onCreateCandidate}
          onUpdateCandidate={onUpdateCandidate}
          onDeleteCandidate={onDeleteCandidate}
        />
      );
    }

    return (
      <ReviewSubmitStep
        formData={normalizedFormData}
          participantPluralLabel={participantLabels.plural}
          eligibleCollegesCount={eligibleCollegeIds.length}
          collegeEligibilityEnabled={collegeEligibilityEnabled}
          departmentEligibilityEnabled={departmentEligibilityEnabled}
          levelEligibilityEnabled={levelEligibilityEnabled}
          validationIssues={fullValidationIssues}
      />
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-2 p-0">
      <div className="rounded-xl border bg-card/60 p-4 shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full sm:w-auto"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Back to Sessions
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <SessionCreationStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          {(error || stepIssues.length > 0) && (
            <Card className="border border-destructive/30 bg-destructive/5 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Step Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
                {stepIssues.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-destructive">
                    {stepIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          )}

          {renderCurrentStep()}

          <SessionCreationNavigation
            isFirstStep={currentStepIndex === 0}
            isLastStep={currentStepIndex === SESSION_CREATION_STEPS.length - 1}
            onBack={() => {
              setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
              clearMessages();
            }}
            onNext={goToNextStep}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            canSubmit={fullValidationIssues.length === 0}
            submitLabel={mode === "create" ? "Create Session" : "Save Session"}
            submittingLabel={mode === "create" ? "Creating..." : "Saving..."}
          />
        </form>
      </div>
    </div>
  );
}
