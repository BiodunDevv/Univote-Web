"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateStudentPasswordMutation } from "@/lib/queries/student";
import { PortalHero, PortalPage } from "@/components/students/portal/portal-page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudentProfilePasswordPage() {
  const updatePassword = useUpdateStudentPasswordMutation();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async () => {
    setLocalError(null);

    if (newPassword.length < 6) {
      setLocalError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    await updatePassword.mutateAsync({
      oldPassword,
      newPassword,
    });

    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Security"
        title="Update password"
        description="Use a strong password that only you know. It should be at least 6 characters long."
      />
      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Password details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next-password">New password</Label>
            <Input
              id="next-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-next-password">Confirm new password</Label>
            <Input
              id="confirm-next-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          {localError || updatePassword.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {localError || (updatePassword.error as Error).message}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => void handleSave()} disabled={updatePassword.isPending}>
              {updatePassword.isPending ? "Updating..." : "Update password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PortalPage>
  );
}
