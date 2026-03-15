"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Crown, Layers3, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePlatformPlansQuery, useUpdatePlatformPlanMutation, type BillingPlan } from "@/lib/queries/platform";
import { LoadingButtonContent } from "@/components/shared/changing-loading-state";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

type EditablePlanState = {
  name: string;
  rank: string;
  monthly_price_ngn: string;
  support_sla: string;
  admin_limit: string;
  participant_limit: string;
  active_session_limit: string;
  features: string;
  entitlements: BillingPlan["entitlements"];
};

function toEditableState(plan: BillingPlan): EditablePlanState {
  return {
    name: plan.name,
    rank: String(plan.rank),
    monthly_price_ngn: String(plan.monthly_price_ngn),
    support_sla: plan.support_sla,
    admin_limit: String(plan.limits.admins),
    participant_limit: String(plan.limits.students),
    active_session_limit: String(plan.limits.active_sessions),
    features: plan.features.join("\n"),
    entitlements: {
      custom_terminology: Boolean(plan.entitlements.custom_terminology),
      custom_identity_policy: Boolean(plan.entitlements.custom_identity_policy),
      custom_participant_structure: true,
      custom_branding: Boolean(plan.entitlements.custom_branding),
      advanced_analytics: Boolean(plan.entitlements.advanced_analytics),
      advanced_reports: Boolean(plan.entitlements.advanced_reports),
      realtime_support: Boolean(plan.entitlements.realtime_support),
      push_notifications: Boolean(plan.entitlements.push_notifications),
      face_verification: Boolean(plan.entitlements.face_verification),
    },
  };
}

const entitlementFields: Array<{
  key: keyof BillingPlan["entitlements"];
  label: string;
}> = [
  { key: "custom_terminology", label: "Custom terminology" },
  { key: "custom_identity_policy", label: "Custom identity" },
  { key: "custom_branding", label: "Custom branding" },
  { key: "advanced_analytics", label: "Advanced analytics" },
  { key: "advanced_reports", label: "Advanced reports" },
  { key: "realtime_support", label: "Realtime support" },
  { key: "push_notifications", label: "Push notifications" },
  { key: "face_verification", label: "Face verification" },
];

function entitlementSummary(plan: BillingPlan) {
  return entitlementFields.map((field) => ({
    ...field,
    enabled: Boolean(plan.entitlements[field.key]),
  }));
}

export default function PlatformPlansPage() {
  const plansQuery = usePlatformPlansQuery();
  const updatePlan = useUpdatePlatformPlanMutation();
  const plans = plansQuery.data?.plans || [];
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === selectedCode) || null,
    [plans, selectedCode],
  );
  const [draft, setDraft] = useState<EditablePlanState | null>(null);

  useEffect(() => {
    if (!selectedPlan) return;
    setDraft(toEditableState(selectedPlan));
  }, [selectedPlan]);

  const handleSave = async () => {
    if (!selectedPlan || !draft) return;

    try {
      const result = await updatePlan.mutateAsync({
        code: selectedPlan.code,
        payload: {
          name: draft.name,
          rank: Number(draft.rank),
          monthly_price_ngn: Number(draft.monthly_price_ngn),
          support_sla: draft.support_sla,
          limits: {
            admins: Number(draft.admin_limit),
            students: Number(draft.participant_limit),
            active_sessions: Number(draft.active_session_limit),
          },
          features: draft.features
            .split("\n")
            .map((feature) => feature.trim())
            .filter(Boolean),
          entitlements: {
            ...draft.entitlements,
            // Participant structure is platform-wide, not a paid gate.
            custom_participant_structure: true,
          },
        },
      });
      toast.success(result.message);
      setSelectedCode(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update plan");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold sm:text-xl">Plan Catalog</h1>
        <p className="text-xs text-muted-foreground">
          Manage live pricing, quotas, and entitlements used by tenant billing and enforcement.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.rank >= 3 ? Crown : Layers3;

          return (
            <Card key={plan.code} className="border-border/70">
              <CardHeader className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{plan.name}</CardTitle>
                      <CardDescription className="text-xs">{plan.support_sla} support</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">Tier {plan.rank}</Badge>
                </div>
                <div className="text-lg font-semibold">
                  {formatMoney(plan.monthly_price_ngn)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / month
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">Code: {plan.code}</Badge>
                  <Badge variant="outline">{plan.support_sla} support</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-dashed p-2 text-center">
                  <div>
                    <div className="text-sm font-semibold">{plan.limits.admins}</div>
                    <div className="text-[11px] text-muted-foreground">Admins</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{plan.limits.students}</div>
                    <div className="text-[11px] text-muted-foreground">Participants</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{plan.limits.active_sessions}</div>
                    <div className="text-[11px] text-muted-foreground">Sessions</div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="size-3.5 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded-xl border p-2">
                  <p className="text-xs font-medium text-foreground">
                    Live entitlement matrix
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {entitlementSummary(plan).map((entitlement) => (
                      <Badge
                        key={entitlement.key}
                        variant={entitlement.enabled ? "default" : "outline"}
                        className="text-[11px]"
                      >
                        {entitlement.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedCode(plan.code)}
                >
                  <PencilLine className="mr-2 size-3.5" />
                  Edit plan
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedPlan && draft)} onOpenChange={(open) => !open && setSelectedCode(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit plan</DialogTitle>
            <DialogDescription>
              Update pricing, quotas, and feature access for the selected plan tier.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && draft ? (
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-name">Plan name</Label>
                  <Input
                    id="plan-name"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-rank">Rank</Label>
                  <Input
                    id="plan-rank"
                    type="number"
                    min="1"
                    value={draft.rank}
                    onChange={(event) => setDraft({ ...draft, rank: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-price">Monthly price (NGN)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min="0"
                    value={draft.monthly_price_ngn}
                    onChange={(event) =>
                      setDraft({ ...draft, monthly_price_ngn: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-sla">Support SLA</Label>
                  <Input
                    id="plan-sla"
                    value={draft.support_sla}
                    onChange={(event) => setDraft({ ...draft, support_sla: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="admins-limit">Admin quota</Label>
                  <Input
                    id="admins-limit"
                    type="number"
                    min="0"
                    value={draft.admin_limit}
                    onChange={(event) => setDraft({ ...draft, admin_limit: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="participants-limit">Participant quota</Label>
                  <Input
                    id="participants-limit"
                    type="number"
                    min="0"
                    value={draft.participant_limit}
                    onChange={(event) =>
                      setDraft({ ...draft, participant_limit: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sessions-limit">Active session quota</Label>
                  <Input
                    id="sessions-limit"
                    type="number"
                    min="0"
                    value={draft.active_session_limit}
                    onChange={(event) =>
                      setDraft({ ...draft, active_session_limit: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-sm font-semibold">Entitlements</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {entitlementFields.map((field) => (
                    <div key={field.key} className="flex items-center justify-between rounded-lg border p-2">
                      <Label htmlFor={`entitlement-${field.key}`} className="text-xs">
                        {field.label}
                      </Label>
                      <Switch
                        id={`entitlement-${field.key}`}
                        checked={Boolean(draft.entitlements[field.key])}
                        onCheckedChange={(checked) =>
                          setDraft({
                            ...draft,
                            entitlements: {
                              ...draft.entitlements,
                              [field.key]: checked,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-features">Feature highlights</Label>
                <Textarea
                  id="plan-features"
                  value={draft.features}
                  onChange={(event) => setDraft({ ...draft, features: event.target.value })}
                  className="min-h-32"
                  placeholder="One feature per line"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedCode(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => void handleSave()} disabled={updatePlan.isPending}>
                  {updatePlan.isPending ? (
                    <LoadingButtonContent label="Saving plan..." />
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
