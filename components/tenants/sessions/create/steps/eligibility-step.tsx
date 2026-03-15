import { Settings2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CollegeQuickSelect,
  DepartmentSelector,
  LevelSelector,
} from "@/components/tenants/sessions/form";
import {
  SessionCreationCollege,
  SessionCreationDepartment,
  SessionCreationFormData,
} from "@/components/tenants/sessions/create/types";

type EligibilityStepProps = {
  colleges: SessionCreationCollege[];
  departments: SessionCreationDepartment[];
  availableLevels: string[];
  formData: SessionCreationFormData;
  participantPluralLabel: string;
  selectedCollegeId: string | null;
  collegeEligibilityEnabled: boolean;
  departmentEligibilityEnabled: boolean;
  levelEligibilityEnabled: boolean;
  onCollegeClick: (collegeId: string) => void;
  onDepartmentChange: (departmentId: string) => void;
  onSelectAllDepartments: () => void;
  onLevelChange: (level: string) => void;
  onToggleOffCampus: (value: boolean) => void;
};

export function EligibilityStep({
  colleges,
  departments,
  availableLevels,
  formData,
  participantPluralLabel,
  selectedCollegeId,
  collegeEligibilityEnabled,
  departmentEligibilityEnabled,
  levelEligibilityEnabled,
  onCollegeClick,
  onDepartmentChange,
  onSelectAllDepartments,
  onLevelChange,
  onToggleOffCampus,
}: EligibilityStepProps) {
  return (
    <div className="space-y-3">
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-muted-foreground" />
            Eligibility Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!collegeEligibilityEnabled &&
          !departmentEligibilityEnabled &&
          !levelEligibilityEnabled ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Tenant-wide eligibility is already applied
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This workspace does not use structure-based access rules. Every eligible{" "}
                {participantPluralLabel.toLowerCase()} will be able to access this session automatically.
              </p>
            </div>
          ) : null}

          {collegeEligibilityEnabled || departmentEligibilityEnabled ? (
            <CollegeQuickSelect
              colleges={colleges}
              selectedCollegeId={selectedCollegeId}
              selectedDepartmentIds={formData.eligible_departments}
              onCollegeClick={onCollegeClick}
              departmentMode={departmentEligibilityEnabled}
              participantPluralLabel={participantPluralLabel}
            />
          ) : null}

          {departmentEligibilityEnabled ? (
            <DepartmentSelector
              colleges={colleges}
              departments={departments}
              selectedDepartmentIds={formData.eligible_departments}
              onDepartmentChange={onDepartmentChange}
              onSelectAllDepartments={onSelectAllDepartments}
              loading={false}
            />
          ) : null}

          {levelEligibilityEnabled ? (
            <LevelSelector
              availableLevels={availableLevels}
              selectedLevels={formData.eligible_levels}
              selectionCount={
                departmentEligibilityEnabled
                  ? formData.eligible_departments.length
                  : collegeEligibilityEnabled
                    ? (selectedCollegeId ? 1 : 0)
                    : 1
              }
              selectionRequiredLabel={
                departmentEligibilityEnabled
                  ? "departments"
                  : collegeEligibilityEnabled
                    ? "college"
                    : "scope"
              }
              emptySelectionMessage={
                departmentEligibilityEnabled
                  ? "Select at least one department first"
                  : collegeEligibilityEnabled
                    ? "Select one college first"
                    : "Select the session scope first"
              }
              onLevelChange={onLevelChange}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Voting Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2">
            <Checkbox
              id="is_off_campus_allowed"
              checked={formData.is_off_campus_allowed}
              onCheckedChange={(checked) => onToggleOffCampus(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label
                htmlFor="is_off_campus_allowed"
                className="text-sm font-medium"
              >
                Allow Off-Campus Voting
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, eligible {participantPluralLabel.toLowerCase()} can vote from outside the
                geofenced area.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
