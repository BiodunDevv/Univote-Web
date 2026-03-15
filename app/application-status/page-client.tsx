"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useRetryTenantApplicationCheckoutMutation,
  useTenantApplicationStatusQuery,
} from "@/lib/queries/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toTitleCase(value?: string | null) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getApplicationStatusTone(status?: string) {
  if (status === "active" || status === "approved") {
    return {
      icon: ShieldCheck,
      label: "Approved",
      description: "The workspace is approved and ready for access.",
      className: "text-emerald-600",
    };
  }

  if (status === "draft") {
    return {
      icon: RefreshCcw,
      label: "Needs update",
      description: "The application has been returned for changes before approval.",
      className: "text-amber-600",
    };
  }

  if (status === "pending_payment") {
    return {
      icon: CreditCard,
      label: "Awaiting payment",
      description: "Billing must be completed before platform review can continue.",
      className: "text-primary",
    };
  }

  return {
    icon: Clock3,
    label: "In review",
    description: "Payment is complete and the application is waiting for platform approval.",
    className: "text-primary",
  };
}

function getInvoiceTone(status?: string) {
  if (status === "paid") {
    return {
      icon: CheckCircle2,
      label: "Payment confirmed",
      className: "text-emerald-600",
    };
  }

  if (status === "failed") {
    return {
      icon: XCircle,
      label: "Payment failed",
      className: "text-destructive",
    };
  }

  return {
    icon: Loader2,
    label: "Payment pending",
    className: "text-primary",
  };
}

export default function ApplicationStatusClientPage() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("reference") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [submitted, setSubmitted] = useState(Boolean(reference && email));
  const statusQuery = useTenantApplicationStatusQuery(reference, email, submitted);
  const retryMutation = useRetryTenantApplicationCheckoutMutation(reference);

  const application = statusQuery.data?.application;
  const invoice = statusQuery.data?.invoice;
  const statusTone = getApplicationStatusTone(application?.status);
  const invoiceTone = getInvoiceTone(invoice?.status);
  const timeline = useMemo(
    () => application?.status_timeline || [],
    [application?.status_timeline],
  );

  return (
    <main className="min-h-screen bg-background px-4 py-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Application status</CardTitle>
            <CardDescription>
              Track onboarding progress, review payment state, and continue checkout if billing is
              still pending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="reference">Application reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value.toUpperCase())}
                  placeholder="APP-20260315-AB12CD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="owner@organization.org"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full sm:w-auto">
                  Check status
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {statusQuery.isFetching ? (
          <Card className="shadow-none">
            <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading application status...
            </CardContent>
          </Card>
        ) : statusQuery.error ? (
          <Card className="border-destructive/40 shadow-none">
            <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
              <AlertCircle className="size-4 text-destructive" />
              {statusQuery.error.message}
            </CardContent>
          </Card>
        ) : application ? (
          <>
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>{application.name}</CardTitle>
                    <CardDescription>
                      {application.reference} · {toTitleCase(application.plan_code)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{toTitleCase(application.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                  <statusTone.icon className={`mt-0.5 size-5 ${statusTone.className}`} />
                  <div className="space-y-1">
                    <p className="font-medium">{statusTone.label}</p>
                    <p className="text-sm text-muted-foreground">{statusTone.description}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Plan:</span> {toTitleCase(application.plan_code)}</p>
                    <p><span className="text-muted-foreground">Payment state:</span> {toTitleCase(application.payment_status)}</p>
                    <p><span className="text-muted-foreground">Contact:</span> {application.contact_email}</p>
                    <p><span className="text-muted-foreground">Coupon:</span> {application.coupon_code || "No coupon applied"}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Submitted:</span>{" "}
                      {new Date(application.application_submitted_at).toLocaleString()}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last update:</span>{" "}
                      {application.application_last_updated_at
                        ? new Date(application.application_last_updated_at).toLocaleString()
                        : "Not available"}
                    </p>
                    {application.rejection_reason ? (
                      <p><span className="text-muted-foreground">Review note:</span> {application.rejection_reason}</p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Use the same contact email from the application when returning here to track progress or retry payment.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={`${item.status}-${index}`} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="font-medium">{item.label || item.status}</p>
                      <p className="text-muted-foreground">{new Date(item.at).toLocaleString()}</p>
                      {item.note ? <p className="text-muted-foreground">{item.note}</p> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>
                  Review the latest invoice and continue checkout if the application is still waiting on billing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
                  <invoiceTone.icon
                    className={`mt-0.5 size-5 ${invoiceTone.className} ${invoice?.status === "pending" ? "animate-spin" : ""}`}
                  />
                  <div className="space-y-1">
                    <p className="font-medium">{invoiceTone.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice
                        ? `${invoice.invoice_number} · NGN ${invoice.amount_ngn.toLocaleString()}`
                        : "No invoice has been generated for this application yet."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {statusQuery.data?.next_actions
                    ?.filter((action) => action.href)
                    .map((action) => (
                      <Button key={action.key} asChild>
                        <a href={action.href || "#"} target="_self" rel="noreferrer">
                          {action.label}
                        </a>
                      </Button>
                    ))}
                  {invoice && ["pending", "failed"].includes(invoice.status) ? (
                    <Button
                      variant="outline"
                      disabled={retryMutation.isPending}
                      onClick={async () => {
                        try {
                          const response = await retryMutation.mutateAsync();
                          if (response.checkout_url) {
                            window.location.assign(response.checkout_url);
                            return;
                          }
                          toast.success(response.message);
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to retry checkout");
                        }
                      }}
                    >
                      {retryMutation.isPending ? "Preparing checkout..." : "Retry payment"}
                    </Button>
                  ) : null}
                  <Button variant="ghost" asChild>
                    <Link href="/">Back to home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </main>
  );
}
