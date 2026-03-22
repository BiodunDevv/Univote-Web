"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2 } from "lucide-react";
import {
  BasicInfoStep,
  CollegeCreationNavigation,
  CollegeCreationStepper,
  DepartmentsStep,
  ReviewStep,
  COLLEGE_CREATION_STEPS,
  emptyCollegeForm,
  emptyDepartment,
  type CollegeCreationFormData,
  type CollegeCreationStep,
  type DepartmentFormData,
  validateCollegeStep,
  validateFullCollege,
} from "@/components/tenants/colleges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCollegeStore } from "@/lib/store/useCollegeStore";
import {
  TenantAccessRestricted,
  TenantPageHeader,
  TenantSectionCard,
} from "@/components/tenants/shared";
import { hasAnyTenantPermission } from "@/lib/tenant-permissions";

export default function CreateCollegePage() {
  const router = useRouter();
  const { token, admin, membership } = useAuthStore();
  const { createCollege, loading, error } = useCollegeStore();

  const [formData, setFormData] =
    useState<CollegeCreationFormData>(emptyCollegeForm());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<CollegeCreationStep[]>(
    [],
  );
  const [stepIssues, setStepIssues] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canManageColleges =
    admin?.role === "super_admin" ||
    hasAnyTenantPermission(membership, ["tenant.manage", "students.manage"]);
  const currentStep = COLLEGE_CREATION_STEPS[currentStepIndex].id;

  useEffect(() => {
    if (admin && !canManageColleges) {
      router.replace("/dashboard/structure/colleges");
    }
  }, [admin, canManageColleges, router]);

  const fullValidationIssues = useMemo(
    () => validateFullCollege(formData),
    [formData],
  );

  const handleChange = (
    field: keyof CollegeCreationFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepIssues([]);
    setSubmitError(null);
  };

  const handleAddDepartment = () => {
    setFormData((prev) => ({
      ...prev,
      departments: [...prev.departments, emptyDepartment()],
    }));
    setCurrentStepIndex(1);
    setStepIssues([]);
    setSubmitError(null);
  };

  const handleRemoveDepartment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, idx) => idx !== index),
    }));
    setStepIssues([]);
    setSubmitError(null);
  };

  const handleUpdateDepartment = (
    index: number,
    field: keyof DepartmentFormData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.map((department, idx) =>
        idx === index ? { ...department, [field]: value } : department,
      ),
    }));
    setStepIssues([]);
    setSubmitError(null);
  };

  const goToNextStep = () => {
    const issues = validateCollegeStep(currentStep, formData);
    if (issues.length > 0) {
      setStepIssues(issues);
      setSubmitError("Resolve the highlighted issues before continuing.");
      return;
    }

    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep],
    );
    setCurrentStepIndex((prev) =>
      Math.min(prev + 1, COLLEGE_CREATION_STEPS.length - 1),
    );
    setStepIssues([]);
    setSubmitError(null);
  };

  const goToPreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    setStepIssues([]);
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    const issues = validateFullCollege(formData);
    if (issues.length > 0) {
      setStepIssues(issues);
      setSubmitError(
        "Resolve the validation issues before creating this college.",
      );

      const firstInvalidStep = COLLEGE_CREATION_STEPS.find(
        (step) => validateCollegeStep(step.id, formData).length > 0,
      );
      if (firstInvalidStep) {
        setCurrentStepIndex(
          COLLEGE_CREATION_STEPS.findIndex(
            (step) => step.id === firstInvalidStep.id,
          ),
        );
      }
      return;
    }

    try {
      await createCollege(token, {
        ...formData,
        departments:
          formData.departments.length > 0 ? formData.departments : undefined,
      });
      router.push("/dashboard/structure/colleges");
    } catch {
      setSubmitError("College creation failed. Review the form and try again.");
    }
  };

  const renderStep = () => {
    if (currentStep === "basic") {
      return <BasicInfoStep formData={formData} onChange={handleChange} />;
    }

    if (currentStep === "departments") {
      return (
        <DepartmentsStep
          formData={formData}
          onAddDepartment={handleAddDepartment}
          onRemoveDepartment={handleRemoveDepartment}
          onUpdateDepartment={handleUpdateDepartment}
        />
      );
    }

    return (
      <ReviewStep formData={formData} validationIssues={fullValidationIssues} />
    );
  };

  if (admin && !canManageColleges) {
    return (
      <TenantAccessRestricted
        title="College creation is restricted"
        description="Your current university role can’t create colleges. Ask your workspace owner for structure management access if you need to add a new college."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-0">
      <TenantPageHeader
        eyebrow="University structure"
        icon={<Building2 className="h-5 w-5" />}
        title="Create College"
        subtitle="Build a college in guided steps with cleaner validation, department capture, and review before submission."
        onBack={() => router.push("/dashboard/structure/colleges")}
        stats={[
          {
            label: "Step",
            value: `${currentStepIndex + 1}/${COLLEGE_CREATION_STEPS.length}`,
          },
          {
            label: "Departments queued",
            value: formData.departments.length.toLocaleString(),
          },
          {
            label: "Validation issues",
            value: fullValidationIssues.length.toLocaleString(),
          },
          {
            label: "Mode",
            value: "Guided setup",
          },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-3">
        <TenantSectionCard
          title="Progress"
          description="Move through the university setup, then review the full payload before creating the college."
        >
          <CollegeCreationStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </TenantSectionCard>

        {(error || submitError || stepIssues.length > 0) && (
          <Card className="border border-destructive/30 bg-destructive/5 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Step Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(submitError || error) && (
                <p className="text-xs text-destructive">
                  {submitError || error}
                </p>
              )}
              {stepIssues.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-xs text-destructive">
                  {stepIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <TenantSectionCard
          title={COLLEGE_CREATION_STEPS[currentStepIndex].title}
          description={COLLEGE_CREATION_STEPS[currentStepIndex].description}
        >
          {renderStep()}
        </TenantSectionCard>

        <CollegeCreationNavigation
          isFirstStep={currentStepIndex === 0}
          isLastStep={currentStepIndex === COLLEGE_CREATION_STEPS.length - 1}
          onBack={goToPreviousStep}
          onNext={goToNextStep}
          onCancel={() => router.push("/dashboard/structure/colleges")}
          isSubmitting={loading}
          canSubmit={fullValidationIssues.length === 0}
        />
      </form>
    </div>
  );
}
