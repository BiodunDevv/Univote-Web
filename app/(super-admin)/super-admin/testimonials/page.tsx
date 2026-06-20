"use client";

import { useState } from "react";
import { MessageSquareQuote, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import {
  usePlatformTestimonialsQuery,
  useUpdatePlatformTestimonialMutation,
  useDeletePlatformTestimonialMutation,
} from "@/lib/queries/platform";
import type { LandingTestimonial } from "@/types/landing";
import { TestimonialEditorDialog } from "@/components/super-admin/testimonial-editor-dialog";
import { TenantPageHeader } from "@/components/tenants/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StatusValue = "published" | "pending_review" | "draft" | "rejected";

const STATUS_BADGE: Record<StatusValue, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  pending_review: {
    label: "Pending review",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  draft: {
    label: "Draft",
    className: "bg-muted/60 text-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    className: "border-destructive/30 bg-destructive/5 text-destructive",
  },
};

function buildInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function TestimonialRow({
  testimonial,
  index,
  onEdit,
}: {
  testimonial: LandingTestimonial;
  index: number;
  onEdit: (t: LandingTestimonial) => void;
}) {
  const updateMutation = useUpdatePlatformTestimonialMutation(testimonial.id);
  const deleteMutation = useDeletePlatformTestimonialMutation();
  const [actionPending, setActionPending] = useState<string | null>(null);

  const isPublished = testimonial.status === "published";
  const badgeConfig = STATUS_BADGE[testimonial.status as StatusValue] ?? STATUS_BADGE.draft;

  async function togglePublish() {
    const next = isPublished ? "draft" : "published";
    setActionPending(next);
    try {
      await updateMutation.mutateAsync({ status: next });
      toast.success(isPublished ? "Testimonial unpublished" : "Testimonial published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setActionPending(null);
    }
  }

  async function handleDelete() {
    setActionPending("delete");
    try {
      await deleteMutation.mutateAsync(testimonial.id);
      toast.success("Testimonial deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
      setActionPending(null);
    }
  }

  const isBusy = actionPending !== null;

  return (
    <TableRow className="group">
      <TableCell className="w-10 text-center text-xs text-muted-foreground tabular-nums">
        {index}
      </TableCell>

      {/* Author */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {testimonial.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={testimonial.avatar_url}
                alt={testimonial.author_name}
                className="h-full w-full object-cover"
              />
            ) : (
              buildInitials(testimonial.author_name)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {testimonial.author_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{testimonial.author_role}</p>
          </div>
        </div>
      </TableCell>

      {/* Organization */}
      <TableCell className="text-sm text-muted-foreground">
        {testimonial.institution_name}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant="outline" className={badgeConfig.className}>
          {badgeConfig.label}
        </Badge>
      </TableCell>

      {/* Quote */}
      <TableCell className="max-w-xs">
        <p className="line-clamp-2 text-sm text-muted-foreground">{testimonial.quote}</p>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-10 text-right">
        {isBusy ? (
          <span className="text-xs text-muted-foreground">
            {actionPending === "delete" ? "Deleting…" : isPublished ? "Unpublishing…" : "Publishing…"}
          </span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(testimonial)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={togglePublish}>
                {isPublished ? "Unpublish" : "Publish"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function PlatformTestimonialsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editingTestimonial, setEditingTestimonial] = useState<LandingTestimonial | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = usePlatformTestimonialsQuery({
    search,
    status: status === "all" ? undefined : status,
    limit: 50,
  });

  const testimonials = data?.testimonials ?? [];
  const total = data?.total ?? 0;
  const published = testimonials.filter((t) => t.status === "published").length;
  const pending = testimonials.filter((t) => t.status === "pending_review").length;

  return (
    <div className="space-y-6">
      {/* Edit dialog — single instance at page level, outside the table */}
      <TestimonialEditorDialog
        testimonial={editingTestimonial}
        open={editingTestimonial !== null}
        onOpenChange={(open) => { if (!open) setEditingTestimonial(null); }}
      />

      {/* Create dialog */}
      <TestimonialEditorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Page header */}
      <TenantPageHeader
        eyebrow="Platform console"
        icon={<MessageSquareQuote className="h-4 w-4" />}
        title="Testimonials"
        subtitle="Moderate public proof points, highlight strong quotes, and control what appears on the landing page."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Create testimonial
          </Button>
        }
        stats={
          data
            ? [
                { label: "Total", value: total },
                { label: "Published", value: published },
                { label: "Pending review", value: pending },
              ]
            : undefined
        }
      />

      {/* Table card */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Moderation queue</CardTitle>
            <CardDescription>
              Publish or unpublish testimonials — published ones appear on the landing page immediately.
            </CardDescription>
          </div>
          <div className="grid w-full gap-3 md:max-w-xl md:grid-cols-[1fr_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by author, organization, or quote…"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading testimonials…
            </div>
          ) : error ? (
            <div className="mx-6 mb-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((testimonial, i) => (
                    <TestimonialRow
                      key={testimonial.id}
                      testimonial={testimonial}
                      index={i + 1}
                      onEdit={setEditingTestimonial}
                    />
                  ))}
                  {testimonials.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        No testimonials match the current filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
