"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  usePlatformTestimonialsQuery,
  useUpdatePlatformTestimonialMutation,
} from "@/lib/queries/platform";
import type { LandingTestimonial } from "@/types/landing";
import { TestimonialEditorDialog } from "@/components/super-admin/testimonial-editor-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function QuickStatusButton({
  testimonial,
  status,
  label,
}: {
  testimonial: LandingTestimonial;
  status: "published" | "pending_review" | "rejected";
  label: string;
}) {
  const mutation = useUpdatePlatformTestimonialMutation(testimonial.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isSubmitting || testimonial.status === status}
      onClick={async () => {
        setIsSubmitting(true);
        try {
          await mutation.mutateAsync({ status });
          toast.success(`Testimonial moved to ${status.replace("_", " ")}`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to update testimonial");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {isSubmitting ? `${label}...` : label}
    </Button>
  );
}

export default function PlatformTestimonialsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data, isLoading, error } = usePlatformTestimonialsQuery({
    search,
    status: status === "all" ? undefined : status,
    limit: 50,
  });

  const testimonials = data?.testimonials || [];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] border bg-linear-to-br from-card via-card to-muted/40 p-6 shadow-none lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Sparkles className="size-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Testimonials</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Moderate public proof points, highlight strong quotes, and control publish timing.
          </p>
        </div>
        <TestimonialEditorDialog triggerLabel="Create testimonial" />
      </section>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Moderation Queue</CardTitle>
            <CardDescription>
              Draft, publish, or reject testimonials without leaving the platform console.
            </CardDescription>
          </div>
          <div className="grid w-full gap-3 md:max-w-2xl md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by institution, author, or quote"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
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
        <CardContent>
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading testimonials...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-muted-foreground">
              {error.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>
                      <div className="font-medium">{testimonial.author_name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.author_role}</div>
                    </TableCell>
                    <TableCell>{testimonial.institution_name}</TableCell>
                    <TableCell>
                      <Badge variant={testimonial.status === "published" ? "default" : "secondary"}>
                        {testimonial.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {testimonial.highlighted ? <Badge variant="outline">Highlighted</Badge> : null}
                        <Badge variant="outline">Order {testimonial.sort_order}</Badge>
                        <Badge variant="outline">{testimonial.rating}/5</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[340px] text-sm text-muted-foreground">
                      <p className="line-clamp-3">{testimonial.quote}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <QuickStatusButton
                          testimonial={testimonial}
                          status="published"
                          label="Publish"
                        />
                        <QuickStatusButton
                          testimonial={testimonial}
                          status="pending_review"
                          label="Queue"
                        />
                        <QuickStatusButton
                          testimonial={testimonial}
                          status="rejected"
                          label="Reject"
                        />
                        <TestimonialEditorDialog
                          triggerLabel="Edit"
                          testimonial={testimonial}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {testimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No testimonials match the current filter.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
