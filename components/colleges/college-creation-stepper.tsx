import { CheckCircle2 } from "lucide-react";
import { COLLEGE_CREATION_STEPS, type CollegeCreationStep } from "./types";

type CollegeCreationStepperProps = {
  currentStep: CollegeCreationStep;
  completedSteps: CollegeCreationStep[];
};

export function CollegeCreationStepper({
  currentStep,
  completedSteps,
}: CollegeCreationStepperProps) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 shadow-none">
      <div className="grid gap-2 md:grid-cols-3">
        {COLLEGE_CREATION_STEPS.map((step, index) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <div
              key={step.id}
              className={`rounded-lg border px-3 py-2 ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : isCompleted
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-border bg-background"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                <p className="text-xs font-semibold text-foreground">
                  {step.title}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
