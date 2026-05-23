"use client";

import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StudentLogoutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  studentName?: string | null;
};

export function StudentLogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  studentName,
}: StudentLogoutConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-transparent">
            <LogOut className="h-4 w-4" />
          </AlertDialogMedia>
          <AlertDialogTitle>Log out of Univote?</AlertDialogTitle>
          <AlertDialogDescription>
            {studentName ? `${studentName}, ` : ""}
            you will need to sign in again before viewing elections, results,
            or casting a vote.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Stay signed in</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
          >
            {isPending ? "Logging out..." : "Log out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
