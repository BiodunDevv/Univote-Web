import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CollegeCreationFormData } from "../types";

type ReviewStepProps = {
  formData: CollegeCreationFormData;
  validationIssues: string[];
};

export function ReviewStep({ formData, validationIssues }: ReviewStepProps) {
  const isValid = validationIssues.length === 0;

  return (
    <div className="space-y-3">
      <div
        className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
          isValid
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
            : "border-amber-500/30 bg-amber-500/5 text-amber-700"
        }`}
      >
        {isValid ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <span>
          {isValid
            ? "Ready to create this college."
            : `${validationIssues.length} issue${validationIssues.length > 1 ? "s" : ""} need attention.`}
        </span>
      </div>

      {validationIssues.length > 0 && (
        <Card className="border-destructive/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-destructive">
              Validation Issues
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

      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            College Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            {formData.name || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Code:</span>{" "}
            <Badge variant="outline" className="font-mono text-[10px]">
              {formData.code || "-"}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">Dean:</span>{" "}
            {formData.dean_name || "Not assigned"}
          </p>
          <p>
            <span className="text-muted-foreground">Dean Email:</span>{" "}
            {formData.dean_email || "Not provided"}
          </p>
          <p>
            <span className="text-muted-foreground">Departments:</span>{" "}
            {formData.departments.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
