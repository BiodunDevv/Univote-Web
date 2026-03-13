"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";

export default function StudentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, token, hasHydrated, isLoading, error, clearError } =
    useStudentAuthStore();

  const [matricNo, setMatricNo] = useState("");
  const [password, setPassword] = useState("");
  const ref = searchParams.get("ref") || "/students/home";

  useEffect(() => {
    if (hasHydrated && token) {
      router.replace(ref);
    }
  }, [hasHydrated, token, router, ref]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    try {
      const result = await login(matricNo, password);
      if (result.newDevice) {
        toast.info("New device detected", {
          description:
            "A security email has been sent to your registered address.",
        });
      }
      router.replace(ref);
    } catch (submitError) {
      if (
        submitError instanceof Error &&
        submitError.message === "FIRST_LOGIN"
      ) {
        router.replace(
          `/students/create-password?ref=${encodeURIComponent(ref)}`,
        );
      }
    }
  };

  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/30 p-8 shadow-none sm:p-10">
          <div className="inline-flex rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Student access
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Sign in to vote, track your sessions, and view results in one place.
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground">
            Use your matric number and your current password. New students can sign in with the default password and will be prompted to secure the account immediately.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Card className="border bg-muted/30 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  Default onboarding
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  First login uses the default password `1234`, followed by a forced password change.
                </p>
              </CardContent>
            </Card>
            <Card className="border bg-muted/30 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  Secure verification
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ballot access still respects session eligibility, location, and face verification rules.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border bg-muted p-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Student Sign In</CardTitle>
                <CardDescription>
                  Continue to the Univote student portal.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="matric-no">Matric number</Label>
                <Input
                  id="matric-no"
                  autoCapitalize="characters"
                  placeholder="BU22CSC1001"
                  value={matricNo}
                  onChange={(event) => setMatricNo(event.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Continue to student portal"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>
                Admin access lives in the management portal.
                {" "}
                <Link href="/auth/signin" className="font-medium text-foreground underline underline-offset-4">
                  Sign in as an administrator
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
