"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CreateCollegeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (formData: CollegeCreationFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
};

export function CreateCollegeModal({
  open,
  onOpenChange,
  onCreate,
  isSubmitting,
  submitError,
}: CreateCollegeModalProps) {
  const [formData, setFormData] =
    useState<CollegeCreationFormData>(emptyCollegeForm());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<CollegeCreationStep[]>(
    [],
  );
  const [stepIssues, setStepIssues] = useState<string[]>([]);

  const currentStep = COLLEGE_CREATION_STEPS[currentStepIndex].id;
  const fullValidationIssues = useMemo(
    () => validateFullCollege(formData),
    [formData],
  );

  const handleModalToggle = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormData(emptyCollegeForm());
      setCurrentStepIndex(0);
      setCompletedSteps([]);
      setStepIssues([]);
    }
    onOpenChange(nextOpen);
  };

  const handleChange = (
    field: keyof CollegeCreationFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepIssues([]);
  };

  const handleAddDepartment = () => {
    setFormData((prev) => ({
      ...prev,
      departments: [...prev.departments, emptyDepartment()],
    }));
    setCurrentStepIndex(1);
    setStepIssues([]);
  };

  const handleRemoveDepartment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, idx) => idx !== index),
    }));
    setStepIssues([]);
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
  };

  const goToNextStep = () => {
    const issues = validateCollegeStep(currentStep, formData);
    if (issues.length > 0) {
      setStepIssues(issues);
      return;
    }

    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep],
    );
    setCurrentStepIndex((prev) =>
      Math.min(prev + 1, COLLEGE_CREATION_STEPS.length - 1),
    );
    setStepIssues([]);
  };

  const goToPreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    setStepIssues([]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const issues = validateFullCollege(formData);
    if (issues.length > 0) {
      setStepIssues(issues);
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

    await onCreate(formData);
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

  return (
    <Dialog open={open} onOpenChange={handleModalToggle}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create College</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <CollegeCreationStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          {(submitError || stepIssues.length > 0) && (
            <Card className="border border-destructive/30 bg-destructive/5 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {submitError && (
                  <p className="text-xs text-destructive">{submitError}</p>
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

          {renderStep()}

          <CollegeCreationNavigation
            isFirstStep={currentStepIndex === 0}
            isLastStep={currentStepIndex === COLLEGE_CREATION_STEPS.length - 1}
            onBack={goToPreviousStep}
            onNext={goToNextStep}
            onCancel={() => handleModalToggle(false)}
            isSubmitting={Boolean(isSubmitting)}
            canSubmit={fullValidationIssues.length === 0}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
