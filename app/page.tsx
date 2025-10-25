"use client";
import CallToAction from "@/components/Landing/CallToAction";
import ContactSection from "@/components/Landing/Contact";
import Features from "@/components/Landing/features";
import FooterSection from "@/components/Landing/Footer";
import HeroSection from "@/components/Landing/hero-section";
import IntegrationsSection from "@/components/Landing/integrations";
import { Reviews } from "@/components/Landing/Reviews";
import StudentsSection from "@/components/Landing/students";
import UniversitiesSection from "@/components/Landing/universities";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Features />
      <IntegrationsSection />
      <UniversitiesSection />
      <StudentsSection />
      <Reviews />
      <CallToAction />
      <ContactSection />
      <FooterSection />
    </>
  );
}
