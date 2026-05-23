"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { useUpdateStudentPasswordMutation } from "@/lib/queries/student";
import { PortalHero, PortalPage } from "@/components/students/portal/portal-page";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function StudentProfilePasswordPage() {
  const updatePassword = useUpdateStudentPasswordMutation();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength =
    newPassword.length === 0
      ? 0
      : newPassword.length < 6
        ? 1
        : newPassword.length < 10
          ? 2
          : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
            ? 4
            : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "",
    "bg-destructive",
    "bg-amber-400",
    "bg-blue-500",
    "bg-emerald-500",
  ][strength];

  const handleSave = async () => {
    setLocalError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setLocalError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    await updatePassword.mutateAsync({ oldPassword, newPassword });
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
    toast.success("Password updated successfully");
  };

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Security"
        title="Update password"
        description="Use a strong password that only you know. It should be at least 6 characters long and hard to guess."
        actions={
          <div className="flex items-center justify-center rounded-xl border bg-background/70 p-3">
            <LockKeyhole className="h-5 w-5 text-muted-foreground" />
          </div>
        }
      />

      <Card className="animate-slide-up-1 border shadow-none">
        <CardContent className="space-y-5 pt-5">
          {success ? (
            <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/60 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
              Password updated successfully. Your account is now secured with the new password.
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <PasswordField
              id="current-password"
              label="Current password"
              value={oldPassword}
              onChange={setOldPassword}
              show={showOld}
              onToggle={() => setShowOld((v) => !v)}
              autoComplete="current-password"
            />

            <div className="space-y-3">
              <PasswordField
                id="next-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
                autoComplete="new-password"
              />

              {/* Strength meter */}
              {newPassword.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          step <= strength ? strengthColor : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength:{" "}
                    <span className="font-medium text-foreground">
                      {strengthLabel}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>

            <PasswordField
              id="confirm-next-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              autoComplete="new-password"
            />

            {confirmPassword && confirmPassword !== newPassword ? (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            ) : null}

            {localError || updatePassword.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {localError || (updatePassword.error as Error).message}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                className="press-scale h-11 rounded-xl px-6"
                disabled={updatePassword.isPending || !oldPassword || !newPassword || !confirmPassword}
              >
                {updatePassword.isPending ? (
                  <LoadingButtonContent label="Updating password..." />
                ) : (
                  "Update password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips card */}
      <Card className="animate-slide-up-2 border shadow-none">
        <CardContent className="pt-4 pb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Password tips
          </p>
          <ul className="space-y-2">
            {[
              "At least 6 characters long",
              "Mix uppercase letters and numbers for a stronger password",
              "Avoid using your name, matric number, or common words",
              "Don't reuse passwords from other accounts",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PortalPage>
  );
}
