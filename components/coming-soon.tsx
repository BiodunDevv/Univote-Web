"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Construction, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  features?: string[];
  expectedRelease?: string;
  backUrl?: string;
  className?: string;
}

export function ComingSoon({
  title,
  description = "We're working hard to bring you this feature. Stay tuned for updates!",
  icon,
  features = [],
  expectedRelease,
  backUrl = "/dashboard",
  className,
}: ComingSoonProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backUrl} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon || <Construction className="h-10 w-10" />}
        </div>

        {/* Badge */}
        <Badge variant="secondary" className="mb-4 gap-1.5">
          <Sparkles className="h-3 w-3" />
          Coming Soon
        </Badge>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight">{title}</h1>

        {/* Description */}
        <p className="mb-8 max-w-md text-muted-foreground">{description}</p>

        {/* Features List */}
        {features.length > 0 && (
          <div className="mb-8 w-full max-w-sm">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              Planned Features
            </h3>
            <ul className="space-y-2 text-left">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expected Release */}
        {expectedRelease && (
          <p className="text-xs text-muted-foreground">
            Expected: <span className="font-medium">{expectedRelease}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// Quick page wrapper for consistent layout
export function ComingSoonPage({
  title,
  description,
  icon,
  features,
  expectedRelease,
  backUrl,
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col p-6">
      <ComingSoon
        title={title}
        description={description}
        icon={icon}
        features={features}
        expectedRelease={expectedRelease}
        backUrl={backUrl}
      />
    </div>
  );
}
