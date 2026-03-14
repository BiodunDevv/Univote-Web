"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreatePlatformTenantMutation } from "@/lib/queries/platform";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INITIAL_FORM = {
  name: "",
  slug: "",
  primary_domain: "",
  plan_code: "pro" as "pro" | "pro_plus" | "enterprise",
  contact_name: "",
  contact_email: "",
};

export function CreateTenantDialog() {
  const createTenant = useCreatePlatformTenantMutation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await createTenant.mutateAsync({
        ...formData,
        primary_domain: formData.primary_domain || undefined,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
      });

      toast.success("Tenant created successfully");
      setOpen(false);
      setFormData(INITIAL_FORM);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tenant");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Create Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
          <DialogDescription>
            Provision a new tenant workspace and initialize its billing posture.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Tenant name</Label>
              <Input
                id="tenant-name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Bowen University"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-slug">Tenant slug</Label>
              <Input
                id="tenant-slug"
                value={formData.slug}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
                  }))
                }
                placeholder="bowen-demo"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-domain">Primary domain</Label>
              <Input
                id="tenant-domain"
                value={formData.primary_domain}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    primary_domain: event.target.value,
                  }))
                }
                placeholder="bowen.univote.app"
              />
            </div>
            <div className="space-y-2">
              <Label>Starting plan</Label>
              <Select
                value={formData.plan_code}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    plan_code: value as typeof current.plan_code,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="pro_plus">Pro Plus</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact name</Label>
              <Input
                id="contact-name"
                value={formData.contact_name}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    contact_name: event.target.value,
                  }))
                }
                placeholder="Institution owner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.contact_email}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    contact_email: event.target.value,
                  }))
                }
                placeholder="owner@school.edu"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createTenant.isPending}>
              Create tenant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
