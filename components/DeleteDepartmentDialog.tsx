"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  departmentName?: string;
  departmentCode?: string;
  isDeleting?: boolean;
}

export function DeleteDepartmentDialog({
  open,
  onOpenChange,
  onConfirm,
  departmentName,
  departmentCode,
  isDeleting = false,
}: DeleteDepartmentDialogProps) {
  const [confirmationCode, setConfirmationCode] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmationCode("");
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (
      confirmationCode.toUpperCase() === departmentCode?.toUpperCase() &&
      !isDeleting
    ) {
      onConfirm();
    }
  };

  const isCodeMatch =
    confirmationCode.toUpperCase() === departmentCode?.toUpperCase();

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Department?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <span className="block">
                You are about to delete the department{" "}
                <span className="font-semibold text-foreground">
                  {departmentName}
                </span>{" "}
                (
                <span className="font-mono text-primary">{departmentCode}</span>
                ).
              </span>
              <span className="block text-destructive font-medium">
                ⚠️ This will permanently delete the department and all its
                students. This action cannot be undone.
              </span>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Type the department code{" "}
                  <span className="font-mono text-primary">
                    {departmentCode}
                  </span>{" "}
                  to confirm:
                </Label>
                <Input
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder={`Enter ${departmentCode}`}
                  className="uppercase font-mono"
                  disabled={isDeleting}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || !isCodeMatch}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Department"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
