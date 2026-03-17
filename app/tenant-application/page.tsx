"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeroHeader } from "@/components/Landing/header";
import { TenantApplicationSection } from "@/components/Landing/tenant-application";
import { Button } from "@/components/ui/button";

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
