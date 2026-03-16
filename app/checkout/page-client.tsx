"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useResolveCheckoutMutation } from "@/lib/queries/public";
import {
  getStoredAdminToken,
  getStoredAdminTenantSlug,
} from "@/lib/api/client";
import { buildTenantAppUrl } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";
  const mutation = useResolveCheckoutMutation();
  const requestedReferenceRef = useRef<string | null>(null);
  const mutate = mutation.mutate;
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!reference) return;
    if (requestedReferenceRef.current === reference && pollCount === 0) return;

    requestedReferenceRef.current = reference;
    mutate(reference);
  }, [mutate, reference, pollCount]);

  // If still pending after the first resolve, re-poll once after 4 s
  useEffect(() => {
    if (mutation.data?.resolution?.status !== "pending") return;
    if (pollCount > 0) return; // only one auto-retry
    const timer = setTimeout(() => setPollCount((c) => c + 1), 4000);
    return () => clearTimeout(timer);
  }, [mutation.data?.resolution?.status, pollCount]);

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
    )}&email=${encodeURIComponent(resolution.contact_email || "")}`;
  }, [adminTenantSlug, hasAdminSession, resolution]);

  const statusHref = useMemo(() => {
    const params = new URLSearchParams();
    if (resolution?.application_reference) {
      params.set("reference", resolution.application_reference);
    }
    if (resolution?.contact_email) {
      params.set("email", resolution.contact_email);
    }
    const query = params.toString();
    return query ? `/application-status?${query}` : "/application-status";
  }, [resolution?.application_reference, resolution?.contact_email]);

  const statusMeta = useMemo(() => {
    if (resolution?.status === "paid") {
      return {
        icon: CheckCircle2,
        title: "Payment confirmed",
        description:
          "Your payment has been received and the application can continue.",
        className: "text-emerald-600",
      };
    }

    if (resolution?.status === "failed") {
      return {
        icon: XCircle,
        title: "Payment failed",
        description:
          "The latest checkout attempt did not complete successfully.",
        className: "text-destructive",
      };
    }

    return {
      icon: Clock3,
      title: "Payment pending",
      description:
        "The billing provider has not confirmed the final payment outcome yet.",
      className: "text-primary",
    };
  }, [resolution?.status]);

  if (!reference) {
    return (
      <main className="min-h-screen bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Checkout reference missing</CardTitle>
              <CardDescription>
                We could not find a payment reference in this callback URL.
              </CardDescription>
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
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/10 to-transparent" />

      <div className="relative mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to home
            </Link>
          </Button>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Checkout callback
          </Badge>
        </div>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              Secure payment confirmation
            </div>
            <div>
              <CardTitle className="text-2xl">Checkout status</CardTitle>
              <CardDescription>
                We are confirming the latest payment event for {reference}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {mutation.isPending ? (
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Verifying payment with the billing service...
              </div>
            ) : mutation.error ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                  <XCircle className="size-4" />
                  {mutation.error.message}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      requestedReferenceRef.current = null;
                      mutate(reference);
                    }}
                  >
                    <RefreshCcw className="mr-2 size-4" />
                    Try again
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/application-status">Track application</Link>
                  </Button>
                </div>
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
                      <Badge variant="outline">
                        {resolution.invoice.status}
                      </Badge>
                    </div>
                    <p className="mt-2 font-medium">
                      {resolution.invoice.invoice_number}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      NGN {resolution.invoice.amount_ngn.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <span className="text-muted-foreground">
                        Application reference
                      </span>
                    </div>
                    <p className="mt-2 font-medium">
                      {resolution.application_reference || "Not available"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Track with your submitted email on the application status
                      page.
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
                  ) : resolution.status === "failed" &&
                    resolution.retry_checkout_url ? (
                    <Button asChild>
                      <a
                        href={resolution.retry_checkout_url}
                        target="_self"
                        rel="noreferrer"
                      >
                        Retry payment
                      </a>
                    </Button>
                  ) : resolution.status === "pending" ? (
                    <Button
                      variant="outline"
                      disabled={mutation.isPending}
                      onClick={() => {
                        requestedReferenceRef.current = null;
                        mutate(reference);
                      }}
                    >
                      <RefreshCcw className="mr-2 size-4" />
                      {mutation.isPending ? "Checking…" : "Refresh status"}
                    </Button>
                  ) : null}

                  <Button variant="outline" asChild>
                    <Link href={statusHref}>View application status</Link>
                  </Button>

                  {resolution.status !== "pending" ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        requestedReferenceRef.current = null;
                        mutate(reference);
                      }}
                    >
                      <RefreshCcw className="mr-2 size-4" />
                      Refresh status
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
