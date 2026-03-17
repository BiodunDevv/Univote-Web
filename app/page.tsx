"use client";
import Features from "@/components/Landing/features";
import FooterSection from "@/components/Landing/Footer";
import { HeroHeader } from "@/components/Landing/header";
import { HeroSection } from "@/components/Landing/hero-section";
import IntegrationsSection from "@/components/Landing/integrations";
import { TestimonialsSection } from "@/components/Landing/testimonials";
import StudentsSection from "@/components/Landing/students";
import UniversitiesSection from "@/components/Landing/universities";
import { usePublicLandingQuery } from "@/lib/queries/public";

export default function Home() {
  const landingQuery = usePublicLandingQuery();
  const stats = landingQuery.data?.stats;
  const testimonials = landingQuery.data?.testimonials || [];

  return (
    <>
      <HeroHeader />
      <HeroSection stats={stats} />
      <Features />
      <IntegrationsSection />
      <UniversitiesSection />
      <StudentsSection />
      <TestimonialsSection testimonials={testimonials} />
      <FooterSection />
    </>
  );
}
