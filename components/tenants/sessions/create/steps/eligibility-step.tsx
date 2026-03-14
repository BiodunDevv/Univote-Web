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
                Tenant-wide eligibility
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This tenant does not use structure-based eligibility. Every eligible{" "}
                {participantPluralLabel.toLowerCase()} can access the session.
              </p>
            </div>
          ) : null}

          {collegeEligibilityEnabled || departmentEligibilityEnabled ? (
            <CollegeQuickSelect
              colleges={colleges}
              selectedDepartmentIds={formData.eligible_departments}
              onCollegeClick={onCollegeClick}
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

          {departmentEligibilityEnabled && levelEligibilityEnabled ? (
            <LevelSelector
              availableLevels={availableLevels}
              selectedLevels={formData.eligible_levels}
              selectedDepartmentsCount={formData.eligible_departments.length}
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
