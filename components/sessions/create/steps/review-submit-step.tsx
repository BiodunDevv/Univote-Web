import { Calendar, CheckCircle2, MapPin, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionCreationFormData } from "@/components/sessions/create/types";

type ReviewSubmitStepProps = {
  formData: SessionCreationFormData;
  eligibleCollegesCount: number;
  validationIssues: string[];
};

export function ReviewSubmitStep({
  formData,
  eligibleCollegesCount,
  validationIssues,
}: ReviewSubmitStepProps) {
  const candidatesByPosition = formData.candidates.reduce<
    Record<string, number>
  >((acc, candidate) => {
    const key = candidate.position || "Unassigned";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-semibold text-foreground">
                {formData.start_time && formData.end_time
                  ? "Configured"
                  : "Incomplete"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <Users2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Candidates</p>
              <p className="text-sm font-semibold text-foreground">
                {formData.candidates.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Categories</p>
              <p className="text-sm font-semibold text-foreground">
                {formData.categories.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Eligibility</p>
              <p className="text-sm font-semibold text-foreground">
                {formData.eligible_departments.length} depts /{" "}
                {formData.eligible_levels.length} lvls
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Final Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Session Title</p>
            <p className="font-medium text-foreground">
              {formData.title || "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Voting Scope</p>
            <p className="font-medium text-foreground">
              {eligibleCollegesCount} college(s),{" "}
              {formData.eligible_departments.length} department(s),{" "}
              {formData.eligible_levels.length} level(s)
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Candidates by Category
            </p>
            <div className="mt-1 grid gap-1 md:grid-cols-2">
              {Object.keys(candidatesByPosition).length === 0 ? (
                <p className="text-muted-foreground">No candidates added yet</p>
              ) : (
                Object.entries(candidatesByPosition).map(
                  ([position, count]) => (
                    <p key={position} className="text-foreground">
                      {position}: <span className="font-semibold">{count}</span>
                    </p>
                  ),
                )
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Voting Radius</p>
            <p className="font-medium text-foreground">
              {formData.location.radius_meters.toLocaleString()} meters
            </p>
          </div>
        </CardContent>
      </Card>

      {validationIssues.length > 0 && (
        <Card className="border border-destructive/30 bg-destructive/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-destructive">
              Resolve Before Create
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-xs text-destructive">
              {validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
