"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useResolveCheckoutMutation } from "@/lib/queries/public";
import { getStoredAdminToken, getStoredAdminTenantSlug } from "@/lib/api/client";
import { buildTenantAppUrl } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";
  const mutation = useResolveCheckoutMutation();

  useEffect(() => {
    if (!reference) return;
    mutation.mutate(reference);
  }, [mutation, reference]);

  const resolution = mutation.data?.resolution;
  const adminTenantSlug = getStoredAdminTenantSlug();
  const hasAdminSession = Boolean(getStoredAdminToken());

  const successHref = useMemo(() => {
    if (!resolution?.tenant?.slug) {
      return "/application-status";
    }

    if (hasAdminSession && adminTenantSlug === resolution.tenant.slug) {
      return "/dashboard/billing";
    }

    if (hasAdminSession) {
      return buildTenantAppUrl(resolution.tenant.slug, "/dashboard/billing");
    }

    return `/application-status?reference=${encodeURIComponent(
      resolution.application_reference || "",
    )}`;
  }, [adminTenantSlug, hasAdminSession, resolution]);

  const statusMeta = useMemo(() => {
    if (resolution?.status === "paid") {
      return {
        icon: CheckCircle2,
        title: "Payment confirmed",
        description: "Your payment has been received and the application can continue.",
        className: "text-emerald-600",
      };
    }

    if (resolution?.status === "failed") {
      return {
        icon: XCircle,
        title: "Payment failed",
        description: "The latest checkout attempt did not complete successfully.",
        className: "text-destructive",
      };
    }

    return {
      icon: Clock3,
      title: "Payment pending",
      description: "The billing provider has not confirmed the final payment outcome yet.",
      className: "text-primary",
    };
  }, [resolution?.status]);

  if (!reference) {
    return (
      <main className="min-h-screen bg-background px-4 py-20">
        <div className="mx-auto max-w-xl">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Checkout reference missing</CardTitle>
              <CardDescription>We could not find a payment reference in this callback URL.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">Return home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-20">
      <div className="mx-auto max-w-xl">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Checkout status</CardTitle>
            <CardDescription>We are confirming the latest payment event for {reference}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {mutation.isPending ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Verifying payment with the billing service...
              </div>
            ) : mutation.error ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-destructive">
                  <XCircle className="size-4" />
                  {mutation.error.message}
                </div>
                <Button asChild variant="outline">
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            ) : resolution ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                  <statusMeta.icon
                    className={`mt-0.5 size-5 ${statusMeta.className} ${resolution.status === "pending" ? "animate-spin" : ""}`}
                  />
                  <div className="space-y-1">
                    <p className="font-medium">{statusMeta.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {statusMeta.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Invoice</span>
                      <Badge variant="outline">{resolution.invoice.status}</Badge>
                    </div>
                    <p className="mt-2 font-medium">{resolution.invoice.invoice_number}</p>
                    <p className="mt-1 text-muted-foreground">
                      NGN {resolution.invoice.amount_ngn.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <span className="text-muted-foreground">Application reference</span>
                    </div>
                    <p className="mt-2 font-medium">
                      {resolution.application_reference || "Not available"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use the same contact email from your application on the status page.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {resolution.status === "paid" ? (
                    <Button
                      onClick={() => {
                        router.push(successHref);
                      }}
                    >
                      Continue
                    </Button>
                  ) : resolution.retry_checkout_url ? (
                    <Button asChild>
                      <a href={resolution.retry_checkout_url} target="_self" rel="noreferrer">
                        Retry payment
                      </a>
                    </Button>
                  ) : null}

                  <Button variant="outline" asChild>
                    <Link
                      href={`/application-status?reference=${encodeURIComponent(
                        resolution.application_reference || "",
                      )}`}
                    >
                      View application status
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
