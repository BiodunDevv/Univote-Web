"use client";

import { useState } from "react";
import { AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { College } from "@/components/colleges";

type EditCollegeFormData = {
  name: string;
  code: string;
  description: string;
  dean_name: string;
  dean_email: string;
  is_active: boolean;
};

type EditCollegeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  college: College | null;
  onSave: (data: EditCollegeFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
};

function buildEditCollegeFormData(college: College | null): EditCollegeFormData {
  return {
    name: college?.name || "",
    code: college?.code || "",
    description: college?.description || "",
    dean_name: college?.dean_name || "",
    dean_email: college?.dean_email || "",
    is_active: college?.is_active ?? true,
  };
}

export function EditCollegeModal({
  open,
  onOpenChange,
  college,
  onSave,
  isSubmitting,
  submitError,
}: EditCollegeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit College</DialogTitle>
        </DialogHeader>
        <EditCollegeModalForm
          key={college?._id ?? "edit-college"}
          initialData={buildEditCollegeFormData(college)}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditCollegeModalForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting,
  submitError,
}: {
  initialData: EditCollegeFormData;
  onSave: (data: EditCollegeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}) {
  const [formData, setFormData] = useState<EditCollegeFormData>(initialData);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(formData);
      }}
      className="space-y-3"
    >
      {submitError && (
        <Card className="border border-destructive/30 bg-destructive/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Update Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-destructive">{submitError}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name" className="text-xs">
            College Name
          </Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-code" className="text-xs">
            College Code
          </Label>
          <Input
            id="edit-code"
            value={formData.code}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                code: event.target.value.toUpperCase(),
              }))
            }
            maxLength={10}
            required
            className="h-9 uppercase"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-description" className="text-xs">
          Description
        </Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              description: event.target.value,
            }))
          }
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-dean-name" className="text-xs">
            Dean Name
          </Label>
          <Input
            id="edit-dean-name"
            value={formData.dean_name}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                dean_name: event.target.value,
              }))
            }
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-dean-email" className="text-xs">
            Dean Email
          </Label>
          <Input
            id="edit-dean-email"
            type="email"
            value={formData.dean_email}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                dean_email: event.target.value,
              }))
            }
            className="h-9"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-9"
        onClick={() =>
          setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))
        }
        disabled={isSubmitting}
      >
        {formData.is_active ? (
          <>
            <ToggleRight className="mr-1 h-4 w-4 text-green-600" />
            Active
          </>
        ) : (
          <>
            <ToggleLeft className="mr-1 h-4 w-4 text-muted-foreground" />
            Inactive
          </>
        )}
      </Button>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
