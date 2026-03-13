import { Settings2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CollegeQuickSelect,
  DepartmentSelector,
  LevelSelector,
} from "@/components/SessionForm";
import {
  SessionCreationCollege,
  SessionCreationDepartment,
  SessionCreationFormData,
} from "@/components/sessions/create/types";

type EligibilityStepProps = {
  colleges: SessionCreationCollege[];
  departments: SessionCreationDepartment[];
  availableLevels: string[];
  formData: SessionCreationFormData;
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
          <CollegeQuickSelect
            colleges={colleges}
            selectedDepartmentIds={formData.eligible_departments}
            onCollegeClick={onCollegeClick}
          />

          <DepartmentSelector
            colleges={colleges}
            departments={departments}
            selectedDepartmentIds={formData.eligible_departments}
            onDepartmentChange={onDepartmentChange}
            onSelectAllDepartments={onSelectAllDepartments}
            loading={false}
          />

          <LevelSelector
            availableLevels={availableLevels}
            selectedLevels={formData.eligible_levels}
            selectedDepartmentsCount={formData.eligible_departments.length}
            onLevelChange={onLevelChange}
          />
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
                When enabled, eligible students can vote from outside the
                geofenced area.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
