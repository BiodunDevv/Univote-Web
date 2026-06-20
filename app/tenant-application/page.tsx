import type { Metadata } from "next";
import { TenantApplicationSection } from "@/components/Landing/tenant-application";
import { buildPublicMetadata } from "../seo";
import { AuthPageShell } from "@/components/Auth/auth-page-shell";

export const metadata: Metadata = buildPublicMetadata({
  title: "Apply for a University Voting Workspace",
  description:
    "Request a Univote workspace for your university and launch secure campus elections with student identity checks and live result delivery.",
  path: "/tenant-application",
  keywords: [
    "apply for university voting software",
    "campus election workspace",
    "student election platform application",
  ],
});

export default function TenantApplicationPage() {
  return (
    <AuthPageShell
      backHref="/"
      backLabel="Back to website"
      align="start"
      maxWidthClassName="max-w-6xl"
    >
      <TenantApplicationSection />
    </AuthPageShell>
  );
}
