"use client";

import { useEffect, useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCreateAnnouncementMutation, useAnnouncementsQuery } from "@/lib/queries/announcements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnnouncementConsole({
  scope,
}: {
  scope: "tenant" | "platform";
}) {
  const { admin } = useAuthStore();
  const isSuperAdmin = admin?.role === "super_admin";
  const announcementsQuery = useAnnouncementsQuery();
  const createAnnouncement = useCreateAnnouncementMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  const audienceOptions = useMemo(
    () =>
      scope === "platform"
        ? [
            { value: "platform_all_users", label: "All users" },
            { value: "platform_tenant_admins", label: "Tenant admins" },
            { value: "platform_participants", label: "Participants" },
            { value: "platform_super_admins", label: "Super admins" },
          ]
        : [
            { value: "tenant_all_users", label: "All tenant users" },
            { value: "tenant_participants", label: "Participants" },
            { value: "tenant_admins", label: "Tenant admins" },
          ],
    [scope],
  );
  const [audienceScope, setAudienceScope] = useState(audienceOptions[0]?.value || "");

  useEffect(() => {
    if (!audienceOptions.some((option) => option.value === audienceScope)) {
      setAudienceScope(audienceOptions[0]?.value || "");
    }
  }, [audienceOptions, audienceScope]);

  const handlePublish = async () => {
    try {
      await createAnnouncement.mutateAsync({
        owner_scope: scope,
        audience_scope: audienceScope,
        channels: sendEmail ? ["in_app", "email"] : ["in_app"],
        title,
        body,
        cta_label: ctaLabel || null,
        cta_link: ctaLink || null,
      });
      toast.success("Announcement published", {
        description: sendEmail
          ? "In-app delivery was queued and email delivery was requested."
          : "In-app delivery was queued successfully.",
      });
      setTitle("");
      setBody("");
      setCtaLabel("");
      setCtaLink("");
      setSendEmail(false);
      setAudienceScope(audienceOptions[0]?.value || "");
    } catch (error) {
      toast.error("Unable to publish announcement", {
        description:
          error instanceof Error ? error.message : "Please review the payload and try again.",
      });
    }
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Compose announcement</CardTitle>
          <CardDescription>
            Publish a compact broadcast to the selected audience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audience">Audience</Label>
            <Select value={audienceScope} onValueChange={setAudienceScope}>
              <SelectTrigger id="audience">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
              {audienceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cta-label">CTA label</Label>
              <Input id="cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-link">CTA link</Label>
              <Input id="cta-link" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={sendEmail} onCheckedChange={(checked) => setSendEmail(Boolean(checked))} />
            Send email in addition to in-app delivery
          </label>
          <Button
            className="w-full"
            disabled={createAnnouncement.isPending || !title.trim() || !body.trim()}
            onClick={() => void handlePublish()}
          >
            {createAnnouncement.isPending ? "Publishing..." : "Publish announcement"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Announcement history
          </CardTitle>
          <CardDescription>
            {isSuperAdmin && scope === "platform"
              ? "Platform-wide broadcasts and operational updates."
              : "Recent tenant broadcasts and delivery results."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          {announcementsQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Loading announcements...
            </div>
          ) : null}
          {announcementsQuery.error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-muted-foreground">
              {announcementsQuery.error instanceof Error
                ? announcementsQuery.error.message
                : "Failed to load announcements."}
            </div>
          ) : null}
          {(announcementsQuery.data?.announcements || []).map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-xl border border-border/70 bg-card/50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{announcement.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {announcement.audience_scope.replace(/_/g, " ")}
                  </p>
                </div>
                <Badge variant="outline">{announcement.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{announcement.body}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{announcement.delivery_summary?.notifications_created || 0} notifications</span>
                <span>{announcement.delivery_summary?.emails_sent || 0}/{announcement.delivery_summary?.emails_attempted || 0} emails</span>
              </div>
            </div>
          ))}
          {!announcementsQuery.isLoading && !announcementsQuery.error && announcementsQuery.data?.announcements?.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                No announcements yet
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
