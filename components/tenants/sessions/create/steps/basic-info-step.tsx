import { FileText, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SessionCreationFormData } from "@/components/tenants/sessions/create/types";

type BasicInfoStepProps = {
  formData: SessionCreationFormData;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onAddCategory: (value: string) => void;
  onRemoveCategory: (index: number) => void;
};

export function BasicInfoStep({
  formData,
  onInputChange,
  onAddCategory,
  onRemoveCategory,
}: BasicInfoStepProps) {
  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Session Basics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="title"
            className="text-xs font-medium text-muted-foreground"
          >
            Election Title
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={onInputChange}
            placeholder="e.g., Leadership Election 2026"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="description"
            className="text-xs font-medium text-muted-foreground"
          >
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onInputChange}
            placeholder="Briefly explain what this election covers"
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Voting Categories
          </Label>
          <div className="flex min-h-10 flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-2">
            {formData.categories.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No categories added yet
              </span>
            ) : (
              formData.categories.map((category, index) => (
                <Badge
                  key={`${category}-${index}`}
                  variant="default"
                  className="inline-flex items-center gap-1"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => onRemoveCategory(index)}
                    className="rounded-full p-0.5 transition-colors hover:bg-primary-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Input
              id="new-category"
              placeholder="e.g., President"
              className="h-9 flex-1 text-sm"
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const value = event.currentTarget.value.trim();
                onAddCategory(value);
                event.currentTarget.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-9 px-3"
              onClick={() => {
                const input = document.getElementById(
                  "new-category",
                ) as HTMLInputElement | null;
                if (!input) return;
                const value = input.value.trim();
                onAddCategory(value);
                input.value = "";
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Add each role to be contested in this election session.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
