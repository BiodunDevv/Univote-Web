import { redirect } from "next/navigation";

export default async function EditCandidateRedirectPage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const { id, candidateId } = await params;
  redirect(`/dashboard/elections/${id}?candidateId=${candidateId}&mode=edit`);
}
