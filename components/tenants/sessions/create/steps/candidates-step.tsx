import { SessionCandidateManager } from "@/components/tenants/sessions/candidates";
import { CandidateMutationDto, SessionCandidate } from "@/types/session";

type CandidatesStepProps = {
  candidates: SessionCandidate[];
  categories: string[];
  persistence: "local" | "remote";
  canManage: boolean;
  onCandidatesChange: (candidates: SessionCandidate[]) => void;
  onCreateCandidate?: (
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  onUpdateCandidate?: (
    candidateId: string,
    payload: CandidateMutationDto,
  ) => Promise<SessionCandidate>;
  onDeleteCandidate?: (candidateId: string) => Promise<void>;
};

export function CandidatesStep({
  candidates,
  categories,
  persistence,
  canManage,
  onCandidatesChange,
  onCreateCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
}: CandidatesStepProps) {
  return (
    <SessionCandidateManager
      title="Candidates and Ballot Setup"
      description="Keep candidate profiles and ballot categories in one place."
      candidates={candidates}
      categories={categories}
      canManage={canManage}
      persistence={persistence}
      onCandidatesChange={onCandidatesChange}
      onCreateCandidate={onCreateCandidate}
      onUpdateCandidate={onUpdateCandidate}
      onDeleteCandidate={onDeleteCandidate}
    />
  );
}
