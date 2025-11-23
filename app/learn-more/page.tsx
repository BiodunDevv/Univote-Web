"use client";

import React from "react";
import Link from "next/link";
import { HeroHeader } from "@/components/Landing/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  MapPin,
  BarChart3,
  Users,
  Vote,
  Lock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Globe,
  Building2,
  GraduationCap,
  TrendingUp,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import FooterSection from "@/components/Landing/Footer";

export default function LearnMorePage() {
  const { token } = useAuthStore();
  const isSignedIn = !!token;

  const coreFeatures = [
    {
      icon: Shield,
      title: "Facial Recognition Security",
      description:
        "Advanced AI-powered facial recognition ensures only verified students can vote, eliminating proxy voting and identity fraud.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: MapPin,
      title: "Geofencing Technology",
      description:
        "Location-based verification ensures votes are cast from authorized campus locations, maintaining election integrity.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Live dashboards provide instant insights into voter turnout, participation rates, and election progress.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description:
        "Military-grade encryption protects every vote from submission to counting, ensuring complete privacy and security.",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Results available instantly after voting closes. No more waiting days for manual counting.",
    },
    {
      icon: Users,
      title: "Higher Participation",
      description:
        "Convenient digital voting increases student engagement and turnout rates by up to 300%.",
    },
    {
      icon: Eye,
      title: "Complete Transparency",
      description:
        "Audit trails and real-time monitoring ensure every vote is accounted for and verifiable.",
    },
    {
      icon: TrendingUp,
      title: "Cost Effective",
      description:
        "Eliminate printing, manual counting, and logistics costs. Save up to 80% on election expenses.",
    },
  ];

  const useCases = [
    {
      title: "Student Union Elections",
      description:
        "Elect student representatives, presidents, and council members with secure, transparent voting.",
      icon: Vote,
    },
    {
      title: "Faculty Board Voting",
      description:
        "Enable faculty members to participate in departmental and institutional decisions remotely.",
      icon: GraduationCap,
    },
    {
      title: "Campus Referendums",
      description:
        "Gather student opinions on campus policies, facilities, and important institutional matters.",
      icon: Building2,
    },
    {
      title: "Club & Society Elections",
      description:
        "Streamline elections for student clubs, societies, and organizations across campus.",
      icon: Globe,
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "< 2s", label: "Average Vote Time" },
    { value: "100%", label: "Vote Accuracy" },
    { value: "24/7", label: "Support Available" },
  ];

  return (
    <>
      <HeroHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="pb-24 pt-32 md:pb-32 lg:pb-40 lg:pt-44">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <Badge className="mb-4" variant="secondary">
                About Univote
              </Badge>
              <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold md:text-5xl lg:text-6xl">
                Revolutionizing Campus Democracy
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
                Univote is the next-generation digital voting platform designed
                specifically for universities and colleges. We combine
                cutting-edge technology with intuitive design to make campus
                elections secure, transparent, and accessible.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link href={isSignedIn ? "/dashboard" : "#contact"}>
                    {isSignedIn ? "Go to Dashboard" : "Get Started Today"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">Explore Features</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              Core Technology
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">
              Built on Advanced Security
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Our platform leverages state-of-the-art technology to ensure every
              election is secure, fair, and transparent.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {coreFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-2 transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              Why Choose Univote
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">
              Benefits That Matter
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Experience the advantages of modern digital voting that
              traditional methods simply can't match.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="text-center transition-all hover:shadow-md"
              >
                <CardHeader>
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              Use Cases
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">
              Perfect for Every Campus Election
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              From student unions to faculty boards, Univote adapts to your
              institution's unique needs.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className="group transition-all hover:border-primary"
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                    <useCase.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {useCase.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-y bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              Simple Process
            </Badge>
            <h2 className="text-3xl font-bold md:text-4xl">
              How Univote Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A seamless voting experience in just a few simple steps.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Verify Identity",
                description:
                  "Students verify their identity using facial recognition and location verification.",
              },
              {
                step: "02",
                title: "Cast Your Vote",
                description:
                  "Browse candidates, review platforms, and cast your vote securely in seconds.",
              },
              {
                step: "03",
                title: "View Results",
                description:
                  "Access real-time results and analytics as soon as voting closes.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="mb-4 text-6xl font-bold text-primary/20">
                  {item.step}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < 2 && (
                  <ArrowRight className="absolute -right-4 top-8 hidden h-8 w-8 text-muted-foreground/30 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                Security First
              </Badge>
              <h2 className="text-3xl font-bold md:text-4xl">
                Enterprise-Grade Security
              </h2>
              <p className="mt-4 text-muted-foreground">
                Univote is built with security at its core. Every aspect of our
                platform is designed to protect voter privacy and election
                integrity.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "256-bit AES encryption for all data",
                  "SOC 2 Type II certified infrastructure",
                  "Regular third-party security audits",
                  "GDPR and data protection compliant",
                  "Multi-factor authentication",
                  "Comprehensive audit logging",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Trusted by Institutions</CardTitle>
                <CardDescription>
                  Join universities worldwide that trust Univote for their
                  democratic processes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Vote Accuracy</span>
                    <span className="font-semibold">100%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-full rounded-full bg-green-600" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>System Uptime</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[99.9%] rounded-full bg-blue-600" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Customer Satisfaction</span>
                    <span className="font-semibold">98%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[98%] rounded-full bg-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary/5 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to Transform Your Campus Elections?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Join the digital democracy revolution. Get started with Univote
            today and experience the future of campus voting.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href={isSignedIn ? "/dashboard" : "#contact"}>
                {isSignedIn ? "Go to Dashboard" : "Request a Demo"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

    <FooterSection />
    </>
  );
}
