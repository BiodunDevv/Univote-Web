import { Check, ShieldCheck } from "lucide-react";
import type { PublicBillingPlan } from "@/types/landing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PricingSection({ plans }: { plans: PublicBillingPlan[] }) {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-2 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full px-4 py-1">
            Plan-aware tenancy
          </Badge>
          <h2 className="mt-4 text-balance text-lg font-semibold sm:text-xl">
            Pricing built for campus growth, not one-off election chaos
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Choose a plan that matches your institution stage, upgrade instantly, and schedule
            downgrades safely at the end of the active billing cycle.
          </p>
        </div>

        <div className="mt-8 grid gap-3 xl:grid-cols-3">
          {plans.map((plan) => {
            const featured = plan.code === "pro_plus";

            return (
              <Card
                key={plan.code}
                className={
                  featured
                    ? "border-primary/30 bg-linear-to-b from-primary/5 to-background shadow-sm"
                    : "border-border/70 shadow-none"
                }
              >
                <CardHeader className="space-y-4 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.support_sla} support SLA</CardDescription>
                    </div>
                    {featured ? (
                      <Badge className="rounded-full px-3 py-1">Most Popular</Badge>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <p className="text-lg font-semibold tracking-tight sm:text-xl">
                      N{plan.monthly_price_ngn.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">per month, billed monthly</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-3 pt-0">
                  <div className="grid gap-2 rounded-2xl bg-muted/50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Admin seats</span>
                      <span className="font-medium">{plan.limits.admins.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Participant records</span>
                      <span className="font-medium">{plan.limits.students.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active sessions</span>
                      <span className="font-medium">
                        {plan.limits.active_sessions.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                          <Check className="size-3" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button asChild className="w-full rounded-xl" variant={featured ? "default" : "outline"}>
                    <a href="#apply">
                      <ShieldCheck className="mr-2 size-4" />
                      Start {plan.name}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
