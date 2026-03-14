import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CollegeCreationFormData } from "../types";

type BasicInfoStepProps = {
  formData: CollegeCreationFormData;
  onChange: (field: keyof CollegeCreationFormData, value: string) => void;
};

export function BasicInfoStep({ formData, onChange }: BasicInfoStepProps) {
  return (
    <div className="space-y-3">
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            College Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                College Name
              </Label>
              <Input
                value={formData.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="College of Engineering"
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Code
              </Label>
              <Input
                value={formData.code}
                onChange={(event) =>
                  onChange("code", event.target.value.toUpperCase())
                }
                placeholder="COE"
                className="h-9 font-mono text-sm uppercase"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={formData.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Brief college description"
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Dean Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Dean Name
            </Label>
            <Input
              value={formData.dean_name}
              onChange={(event) => onChange("dean_name", event.target.value)}
              placeholder="Prof. Jane Doe"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Dean Email
            </Label>
            <Input
              type="email"
              value={formData.dean_email}
              onChange={(event) => onChange("dean_email", event.target.value)}
              placeholder="dean@university.edu"
              className="h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
