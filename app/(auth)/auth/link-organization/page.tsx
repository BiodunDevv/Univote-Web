"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LinkOrganizationPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-lg border shadow-none">
        <CardHeader className="space-y-3">
          <CardTitle>Organisation linking removed</CardTitle>
          <CardDescription>
            This build now uses one university workspace per admin session. Sign
            in directly to the university workspace you want to manage.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="sm:flex-1">
            <Link href="/auth/signin">Go to sign in</Link>
          </Button>
          <Button variant="outline" asChild className="sm:flex-1">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
