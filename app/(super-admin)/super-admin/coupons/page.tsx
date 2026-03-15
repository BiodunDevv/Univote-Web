"use client";

import { useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import {
  type PlatformCoupon,
  useCreatePlatformCouponMutation,
  usePlatformCouponsQuery,
  useUpdatePlatformCouponMutation,
} from "@/lib/queries/platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DEFAULT_FORM = {
  code: "",
  name: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  minimum_amount_ngn: 0,
  usage_limit: "",
  per_applicant_limit: 1,
  is_active: true,
};

function CouponEditor({
  triggerLabel,
  initial,
  onSubmit,
}: {
  triggerLabel: string;
  initial?: typeof DEFAULT_FORM & { id?: string };
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial || DEFAULT_FORM);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={initial ? "outline" : "default"} size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit coupon" : "Create coupon"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await onSubmit({
                ...form,
                usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
              });
              toast.success(initial ? "Coupon updated" : "Coupon created");
              setOpen(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to save coupon");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount type</Label>
              <Select
                value={form.discount_type}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, discount_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount value</Label>
              <Input
                type="number"
                value={form.discount_value}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discount_value: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Minimum amount (NGN)</Label>
              <Input
                type="number"
                value={form.minimum_amount_ngn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minimum_amount_ngn: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Usage limit</Label>
              <Input
                type="number"
                value={form.usage_limit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usage_limit: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <p className="text-sm font-medium">Active coupon</p>
              <p className="text-xs text-muted-foreground">Inactive coupons stay in history but stop validating.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, is_active: checked }))
              }
            />
          </div>
          <Button type="submit" className="w-full">
            {initial ? "Save coupon" : "Create coupon"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PlatformCouponsPage() {
  const couponsQuery = usePlatformCouponsQuery();
  const createMutation = useCreatePlatformCouponMutation();
  const coupons = couponsQuery.data?.coupons || [];

  const activeCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.is_active).length,
    [coupons],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/40 p-6 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Coupons</h1>
            <p className="text-sm text-muted-foreground">
              Manage platform discount codes for applications and billing checkout.
            </p>
          </div>
          <CouponEditor
            triggerLabel="Create coupon"
            onSubmit={async (payload) => {
              await createMutation.mutateAsync(payload);
            }}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader>
            <CardDescription>Total coupons</CardDescription>
            <CardTitle>{coupons.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardDescription>Active coupons</CardDescription>
            <CardTitle>{activeCoupons}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardDescription>Total redemptions</CardDescription>
            <CardTitle>
              {coupons.reduce((sum, coupon) => sum + (coupon.usage_count || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Coupon catalog</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {couponsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading coupons...</div>
          ) : coupons.map((coupon) => <CouponRow key={coupon._id} coupon={coupon} />)}
          {couponsQuery.isLoading || coupons.length ? null : (
            <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
              No coupons created yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CouponRow({
  coupon,
}: {
  coupon: PlatformCoupon;
}) {
  const updateMutation = useUpdatePlatformCouponMutation(coupon._id);

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{coupon.code}</CardTitle>
          <CardDescription>{coupon.name}</CardDescription>
        </div>
        <CouponEditor
          triggerLabel="Edit"
          initial={{
            id: coupon._id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description || "",
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            minimum_amount_ngn: coupon.minimum_amount_ngn || 0,
            usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : "",
            per_applicant_limit: coupon.per_applicant_limit || 1,
            is_active: coupon.is_active,
          }}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync(payload);
          }}
        />
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          {coupon.discount_type === "percentage"
            ? `${coupon.discount_value}% off`
            : `NGN ${coupon.discount_value.toLocaleString()} off`}
        </p>
        <p>Redemptions: {coupon.usage_count}</p>
        <p>Status: {coupon.is_active ? "Active" : "Inactive"}</p>
      </CardContent>
    </Card>
  );
}
