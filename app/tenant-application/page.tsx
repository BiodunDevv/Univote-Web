import type { Metadata } from "next";
import { HeroHeader } from "@/components/Landing/header";
import { TenantApplicationSection } from "@/components/Landing/tenant-application";
import { buildPublicMetadata } from "../seo";

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
    <div className="min-h-screen bg-background">
      <HeroHeader />

      <div className="mx-auto max-w-7xl mt-10">
        <TenantApplicationSection />
      </div>
    </div>
  );
}
