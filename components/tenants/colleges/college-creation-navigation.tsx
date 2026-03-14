import { ArrowLeft, ArrowRight } from "lucide-react";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { Button } from "@/components/ui/button";

type CollegeCreationNavigationProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
};

export function CollegeCreationNavigation({
  isFirstStep,
  isLastStep,
  onBack,
  onNext,
  onCancel,
  isSubmitting,
  canSubmit,
}: CollegeCreationNavigationProps) {
  return (
    <div className="sticky bottom-0 z-10 rounded-xl border bg-background/95 p-3 backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full sm:w-auto"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 sm:flex-none"
            onClick={onBack}
            disabled={isFirstStep || isSubmitting}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="submit"
              className="h-9 flex-1 sm:flex-none"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <LoadingButtonContent label="Creating..." />
              ) : (
                "Create College"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              className="h-9 flex-1 sm:flex-none"
              onClick={onNext}
              disabled={isSubmitting}
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
