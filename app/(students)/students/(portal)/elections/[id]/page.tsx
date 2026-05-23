"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Layers3,
  MapPin,
  Users,
  Vote,
  X,
} from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import {
  PortalEmptyState,
  PortalPage,
} from "@/components/students/portal/portal-page";
import { formatDateTime } from "@/components/students/portal/utils";
import { useStudentSessionDetailQuery } from "@/lib/queries/student";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Candidate = {
  id: string;
  name: string;
  photo_url?: string | null;
  bio?: string | null;
  manifesto?: string | null;
};

function CandidateModal({
  candidate,
  position,
  open,
  onClose,
}: {
  candidate: Candidate | null;
  position: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!candidate) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm gap-0 overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">{candidate.name}</DialogTitle>

        {/* Photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {candidate.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidate.photo_url}
              alt={candidate.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Users className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          {/* Close button — always visible regardless of photo */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Position + name overlay — only when there's a photo */}
          {candidate.photo_url ? (
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-4 pb-3 pt-6">
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">{position}</p>
              <p className="text-base font-semibold text-white">{candidate.name}</p>
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {!candidate.photo_url ? (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{position}</p>
              <p className="mt-0.5 text-base font-semibold text-foreground">{candidate.name}</p>
            </div>
          ) : null}
          {candidate.bio ? (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">About</p>
              <p className="text-sm leading-relaxed text-foreground">{candidate.bio}</p>
            </div>
          ) : null}
          {candidate.manifesto ? (
            <>
              {candidate.bio ? <Separator /> : null}
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Manifesto</p>
                <p className="text-sm leading-relaxed text-foreground">{candidate.manifesto}</p>
              </div>
            </>
          ) : null}
          {!candidate.bio && !candidate.manifesto ? (
            <p className="text-sm text-muted-foreground">No additional information provided.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentElectionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { data, isLoading, error } = useStudentSessionDetailQuery(sessionId);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedPosition, setSelectedPosition] = useState("");

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading election details...",
          "Checking your eligibility...",
          "Preparing the ballot preview...",
        ]}
      />
    );
  }

  const session = data?.session;

  if (!session || error) {
    return (
      <PortalEmptyState
        icon={Vote}
        title="Election unavailable"
        description={
          (error as Error | undefined)?.message ||
          "This election could not be loaded."
        }
      />
    );
  }

  const primaryAction =
    session.status === "active" && session.eligible && !session.has_voted
      ? { href: `/students/vote/${session.id}`, label: "Cast your vote" }
      : session.has_voted
        ? { href: `/students/vote/${session.id}/submitted`, label: "View ballot" }
        : session.status === "ended"
          ? { href: `/students/results/${session.id}`, label: "View results" }
          : null;

  const positionEntries = Object.entries(session.candidates_by_position || {});
  const totalCandidates = positionEntries.reduce(
    (count, [, candidates]) => count + candidates.length,
    0,
  );

  const isActive = session.status === "active";
  const isUpcoming = session.status === "upcoming";

  return (
    <PortalPage>
      {/* Hero card — login-page style with dot grid */}
      <div className="animate-slide-up relative overflow-hidden rounded-2xl border px-5 py-5">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="ed-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ed-dots)" />
        </svg>

        <div className="relative space-y-3">
          {/* Status + voted badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                isActive
                  ? "border-emerald-300/60 bg-emerald-50/60 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : isUpcoming
                    ? "border-amber-300/50 bg-amber-50/50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-400"
                    : "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              {isActive ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              ) : null}
              <span className="capitalize">{session.status}</span>
            </span>
            {session.has_voted ? (
              <span className="flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Vote submitted
              </span>
            ) : null}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
              {session.title}
            </h1>
            {session.description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {session.description}
              </p>
            ) : null}
          </div>

          {/* Inline meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatDateTime(session.start_time)} — {formatDateTime(session.end_time)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""} · {positionEntries.length} position{positionEntries.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {session.is_off_campus_allowed ? "Anywhere" : "On-campus only"}
            </span>
            <span className="flex items-center gap-1.5">
              <Layers3 className="h-3.5 w-3.5 shrink-0" />
              {session.eligibility_scope.summary}
            </span>
          </div>

          {/* CTA */}
          {primaryAction ? (
            <Button asChild size="sm" className="rounded-xl w-full sm:w-auto">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Not eligible alert */}
      {!session.eligible ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {session.eligibility_reason || "You are not eligible to vote in this election."}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Ballot preview — native list style */}
      <section className="animate-slide-up-1 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-sm font-semibold text-foreground">Candidates</p>
          <p className="text-xs text-muted-foreground">{positionEntries.length} position{positionEntries.length !== 1 ? "s" : ""}</p>
        </div>

        {positionEntries.length === 0 ? (
          <PortalEmptyState
            icon={Vote}
            title="No candidates yet"
            description="Candidates have not been published for this election."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {positionEntries.map(([position, candidates]) => (
              <div key={position} className="overflow-hidden rounded-2xl border">
                {/* Position header */}
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                  <p className="text-sm font-semibold text-foreground">{position}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Candidate rows */}
                <div className="divide-y">
                  {candidates.map((candidate, idx) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setSelectedPosition(position);
                      }}
                      className="press-scale flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20"
                    >
                      {/* Avatar */}
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border">
                        {candidate.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground/60">
                            {candidate.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Name + bio snippet */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {candidate.name}
                        </p>
                        {candidate.bio ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {candidate.bio}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground/50">No bio</p>
                        )}
                      </div>

                      {/* Number badge */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Candidate detail modal */}
      <CandidateModal
        candidate={selectedCandidate}
        position={selectedPosition}
        open={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
      />
    </PortalPage>
  );
}
