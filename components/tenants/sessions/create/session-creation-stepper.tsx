import { CheckCircle2 } from "lucide-react";
import {
  SESSION_CREATION_STEPS,
  SessionCreationStep,
} from "@/components/tenants/sessions/create/types";

type SessionCreationStepperProps = {
  currentStep: SessionCreationStep;
  completedSteps: SessionCreationStep[];
};

export function SessionCreationStepper({
  currentStep,
  completedSteps,
}: SessionCreationStepperProps) {
  const currentIndex = SESSION_CREATION_STEPS.findIndex(
    (step) => step.id === currentStep,
  );

  return (
    <div className="rounded-xl border bg-card/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          Session setup progress
        </p>
        <p className="text-xs font-semibold text-foreground">
          Step {Math.max(currentIndex + 1, 1)} of{" "}
          {SESSION_CREATION_STEPS.length}
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        {SESSION_CREATION_STEPS.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <div
              key={step.id}
              className={`rounded-lg border px-3 py-2 transition-colors ${
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
              <p className="line-clamp-2 text-[11px] text-muted-foreground">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
