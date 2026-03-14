"use client";
import Features from "@/components/Landing/features";
import FooterSection from "@/components/Landing/Footer";
import { HeroHeader } from "@/components/Landing/header";
import { HeroSection } from "@/components/Landing/hero-section";
import IntegrationsSection from "@/components/Landing/integrations";
import { PricingSection } from "@/components/Landing/pricing";
import { TenantApplicationSection } from "@/components/Landing/tenant-application";
import { TestimonialsSection } from "@/components/Landing/testimonials";
import StudentsSection from "@/components/Landing/students";
import UniversitiesSection from "@/components/Landing/universities";
import { usePublicLandingQuery } from "@/lib/queries/public";

const fallbackPlans = [
  {
    code: "pro" as const,
    name: "Pro",
    rank: 1,
    monthly_price_ngn: 75000,
    monthly_price_kobo: 7500000,
    support_sla: "Standard",
    limits: { admins: 5, students: 5000, active_sessions: 3 },
    features: [
      "Core election management",
      "Participant web portal",
      "Ticket support",
      "Standard analytics",
    ],
  },
  {
    code: "pro_plus" as const,
    name: "Pro Plus",
    rank: 2,
    monthly_price_ngn: 180000,
    monthly_price_kobo: 18000000,
    support_sla: "Priority",
    limits: { admins: 15, students: 20000, active_sessions: 10 },
    features: [
      "Everything in Pro",
      "Advanced analytics",
      "Real-time support chat",
      "Push notifications",
    ],
  },
  {
    code: "enterprise" as const,
    name: "Enterprise",
    rank: 3,
    monthly_price_ngn: 350000,
    monthly_price_kobo: 35000000,
    support_sla: "Dedicated",
    limits: { admins: 9999, students: 200000, active_sessions: 999 },
    features: [
      "Everything in Pro Plus",
      "Custom branding controls",
      "Priority onboarding",
      "Custom quota overrides",
    ],
  },
];

export default function Home() {
  const landingQuery = usePublicLandingQuery();
  const stats = landingQuery.data?.stats;
  const plans = landingQuery.data?.plans?.length ? landingQuery.data.plans : fallbackPlans;
  const testimonials = landingQuery.data?.testimonials || [];

  return (
    <>
      <HeroHeader />
      <HeroSection stats={stats} />
      <Features />
      <PricingSection plans={plans} />
      <IntegrationsSection />
      <UniversitiesSection />
      <StudentsSection />
      <TestimonialsSection testimonials={testimonials} />
      <TenantApplicationSection plans={plans} />
      <FooterSection />
    </>
  );
}
