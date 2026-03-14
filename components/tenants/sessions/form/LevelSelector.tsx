import { Label } from "@/components/ui/label";

interface LevelSelectorProps {
  availableLevels: string[];
  selectedLevels: string[];
  selectedDepartmentsCount: number;
  onLevelChange: (level: string) => void;
}

export default function LevelSelector({
  availableLevels,
  selectedLevels,
  selectedDepartmentsCount,
  onLevelChange,
}: LevelSelectorProps) {
  return (
    <div
      className={`space-y-2 transition-opacity ${
        selectedDepartmentsCount === 0 ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className={`flex items-center justify-center w-6 h-6 sm:w-5 sm:h-5 rounded-full text-xs font-bold ${
            selectedDepartmentsCount > 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
        <Label className="text-xs sm:text-sm font-medium text-foreground">
          Select Levels
        </Label>
        <span className="text-[10px] text-muted-foreground">
          ({selectedLevels.length} selected)
        </span>
      </div>
      {selectedDepartmentsCount === 0 ? (
        <div className="p-4 border-2 border-dashed rounded-lg text-center bg-muted/20">
          <p className="text-xs text-muted-foreground">
            👆 Please select departments first
          </p>
        </div>
      ) : availableLevels.length === 0 ? (
        <div className="p-4 border-2 border-dashed rounded-lg text-center bg-muted/20">
          <p className="text-xs text-muted-foreground">
            No levels available for selected departments
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {availableLevels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onLevelChange(level)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                  selectedLevels.includes(level)
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted/50"
                }`}
              >
                {selectedLevels.includes(level) && (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>Level {level}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            {selectedLevels.length > 0
              ? `✓ Selected ${selectedLevels.length} level(s)`
              : "Select eligible levels for voting"}
          </p>
        </>
      )}
    </div>
  );
}
