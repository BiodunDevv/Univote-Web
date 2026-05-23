"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateCardGrid } from "@/components/tenants/sessions/candidates/candidate-card-grid";
import {
  CandidateSheet,
  CandidateSheetMode,
  CandidateSheetPayload,
} from "@/components/tenants/sessions/candidates/candidate-sheet";
import { createEmptyCandidate } from "@/components/tenants/sessions/session-form-utils";
import { CandidateMutationDto, SessionCandidate } from "@/types/session";

type SessionCandidateManagerProps = {
  title?: string;
  description?: string;
  candidates: SessionCandidate[];
  categories: string[];
  canManage: boolean;
  canCreateCandidate?: boolean;
  canEditCandidate?: boolean;
  canDeleteCandidate?: boolean;
  persistence: "local" | "remote";
  onCandidatesChange: (candidates: SessionCandidate[]) => void;
  onCreateCandidate?: (
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  onUpdateCandidate?: (
    candidateId: string,
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  onDeleteCandidate?: (candidateId: string) => Promise<void>;
  initialCandidateId?: string | null;
  initialMode?: CandidateSheetMode | null;
  onSheetStateChange?: (state: {
    open: boolean;
    mode: CandidateSheetMode | null;
    candidateId: string | null;
  }) => void;
};

function getCandidateKey(candidate: SessionCandidate, index: number) {
  return candidate._id || candidate.client_id || `${candidate.name}-${index}`;
}

export function SessionCandidateManager({
  title = "Candidates",
  description = "Manage who appears on the ballot for this election.",
  candidates,
  categories,
  canManage,
  canCreateCandidate,
  canEditCandidate,
  canDeleteCandidate,
  persistence,
  onCandidatesChange,
  onCreateCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
  initialCandidateId,
  initialMode,
  onSheetStateChange,
}: SessionCandidateManagerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<CandidateSheetMode>("view");
  const [selectedCandidateKey, setSelectedCandidateKey] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const allowCreate = canCreateCandidate ?? canManage;
  const allowEdit = canEditCandidate ?? canManage;
  const allowDelete = canDeleteCandidate ?? canManage;

  const keyedCandidates = useMemo(
    () =>
      candidates.map((candidate, index) => ({
        key: getCandidateKey(candidate, index),
        candidate,
      })),
    [candidates],
  );

  const activeCandidate =
    keyedCandidates.find((item) => item.key === selectedCandidateKey)?.candidate ||
    null;

  useEffect(() => {
    if (!initialMode) return;

    if (initialMode === "create") {
      if (!allowCreate) return;
      setSelectedCandidateKey(null);
      setSheetMode("create");
      setSheetOpen(true);
      return;
    }

    if (!initialCandidateId) return;

    const target = keyedCandidates.find(
      (item) => item.candidate._id === initialCandidateId,
    );
    if (!target) return;

    setSelectedCandidateKey(target.key);
    setSheetMode(allowEdit ? initialMode : "view");
    setSheetOpen(true);
  }, [allowCreate, allowEdit, initialCandidateId, initialMode, keyedCandidates]);

  useEffect(() => {
    onSheetStateChange?.({
      open: sheetOpen,
      mode: sheetOpen ? sheetMode : null,
      candidateId: sheetOpen ? activeCandidate?._id || null : null,
    });
  }, [activeCandidate?._id, onSheetStateChange, sheetMode, sheetOpen]);

  const openView = (candidate: SessionCandidate) => {
    const target = keyedCandidates.find((item) => item.candidate === candidate);
    if (!target) return;
    setSelectedCandidateKey(target.key);
    setSheetMode("view");
    setSheetOpen(true);
  };

  const openEdit = (candidate: SessionCandidate) => {
    if (!allowEdit) return;
    const target = keyedCandidates.find((item) => item.candidate === candidate);
    if (!target) return;
    setSelectedCandidateKey(target.key);
    setSheetMode("edit");
    setSheetOpen(true);
  };

  const openCreate = () => {
    if (!allowCreate) return;
    setSelectedCandidateKey(null);
    setSheetMode("create");
    setSheetOpen(true);
  };

  const handleSubmit = async (payload: CandidateSheetPayload) => {
    setSubmitting(true);
    try {
      if (persistence === "local") {
        if (sheetMode === "create") {
          onCandidatesChange([...candidates, { ...createEmptyCandidate(), ...payload }]);
          toast.success("Candidate added");
        } else {
          onCandidatesChange(
            candidates.map((candidate, index) =>
              getCandidateKey(candidate, index) === selectedCandidateKey
                ? { ...candidate, ...payload }
                : candidate,
            ),
          );
          toast.success("Candidate updated");
        }
      } else if (sheetMode === "create" && onCreateCandidate) {
        const created = await onCreateCandidate(payload);
        onCandidatesChange([...candidates, created]);
        setSelectedCandidateKey(created._id || null);
        toast.success("Candidate created");
      } else if (
        sheetMode === "edit" &&
        activeCandidate?._id &&
        onUpdateCandidate
      ) {
        const updated = await onUpdateCandidate(activeCandidate._id, payload);
        onCandidatesChange(
          candidates.map((candidate) =>
            candidate._id === updated._id ? { ...candidate, ...updated } : candidate,
          ),
        );
        setSelectedCandidateKey(updated._id || null);
        toast.success("Candidate updated");
      }

      setSheetOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save candidate",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeCandidate) return;

    if (persistence === "local") {
      onCandidatesChange(
        candidates.filter((candidate, index) => {
          return getCandidateKey(candidate, index) !== selectedCandidateKey;
        }),
      );
      setShowDeleteDialog(false);
      setSheetOpen(false);
      toast.success("Candidate removed");
      return;
    }

    if (!activeCandidate._id || !onDeleteCandidate) return;

    setSubmitting(true);
    try {
      await onDeleteCandidate(activeCandidate._id);
      onCandidatesChange(
        candidates.filter((candidate) => candidate._id !== activeCandidate._id),
      );
      setShowDeleteDialog(false);
      setSheetOpen(false);
      toast.success("Candidate deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete candidate",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border shadow-none">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          {allowCreate ? (
            <Button
              type="button"
              variant="outline"
              onClick={openCreate}
              disabled={categories.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <CandidateCardGrid
            candidates={candidates}
            canEdit={allowEdit}
            canCreate={allowCreate}
            onView={openView}
            onEdit={openEdit}
            onCreate={openCreate}
          />
        </CardContent>
      </Card>

      <CandidateSheet
        open={sheetOpen}
        mode={sheetMode}
        candidate={activeCandidate}
        categories={categories}
        canManage={allowEdit}
        isSaving={submitting}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setShowDeleteDialog(false);
          }
        }}
        onModeChange={setSheetMode}
        onSubmit={handleSubmit}
        onDelete={
          allowDelete && allowEdit && sheetMode !== "create"
            ? async () => setShowDeleteDialog(true)
            : undefined
        }
      />

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => void handleDelete()}
        title="Delete candidate?"
        description="This candidate will be removed from the ballot. This action cannot be undone."
        itemName={activeCandidate?.name}
      />
    </>
  );
}
