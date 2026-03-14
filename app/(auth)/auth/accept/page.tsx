"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { decodeTenantHandoffPayload } from "@/lib/tenant";
import { type AuthSessionData, useAuthStore } from "@/lib/store/useAuthStore";

function getHandoffPayloadFromHash(hash: string) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);
  return params.get("handoff");
}

function AuthAcceptPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const ref = useMemo(() => {
    const nextRef = searchParams.get("ref");
    return nextRef && nextRef.startsWith("/") ? nextRef : "/dashboard";
  }, [searchParams]);

  useEffect(() => {
    try {
      const handoffPayload = getHandoffPayloadFromHash(window.location.hash);
      if (!handoffPayload) {
        setError("Sign-in handoff is missing. Please log in again.");
        return;
      }

      const session =
        decodeTenantHandoffPayload<AuthSessionData>(handoffPayload);
      if (!session?.token || !session?.admin || !session?.tenant?.slug) {
        setError("Sign-in handoff is invalid. Please log in again.");
        return;
      }

      setSession(session);
      router.replace(ref);
    } catch {
      setError("Sign-in handoff could not be completed. Please log in again.");
    }
  }, [ref, router, setSession]);

  if (!error) {
    return (
      <ChangingLoadingState
        fullHeight
        messages={[
          "Securing your workspace handoff...",
          "Restoring organisation session...",
          "Opening tenant dashboard...",
        ]}
      />
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unable to complete sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Return to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthAcceptPage() {
  return (
    <Suspense
      fallback={
        <ChangingLoadingState
          fullHeight
          messages={[
            "Securing your workspace handoff...",
            "Restoring organisation session...",
            "Opening tenant dashboard...",
          ]}
        />
      }
    >
      <AuthAcceptPageContent />
    </Suspense>
  );
}
