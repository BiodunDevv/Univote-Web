import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Shield,
  MapPin,
  BarChart3,
} from "lucide-react";
import { ReactNode } from "react";

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="@container mx-auto max-w-5xl px-2 sm:px-6">
        <div className="text-center">
          <h2 className="text-balance text-lg font-semibold sm:text-xl">
            Everything You Need for Secure Digital Elections
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Advanced security, real-time transparency, and effortless management in one
            platform.
          </p>
        </div>
        <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-3 [--color-background:var(--color-muted)] [--color-card:var(--color-muted)] *:text-center md:mt-12 dark:[--color-muted:var(--color-zinc-900)]">
          <Card className="border-none">
            <CardHeader className="p-3 pb-0">
              <CardDecorator>
                <Shield className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-4 text-sm font-semibold">Facial Recognition</h3>
            </CardHeader>

            <CardContent className="p-3 pt-0">
              <p className="text-sm">
                Every vote verified through Microsoft Azure AI. No fake
                accounts, no impersonation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none">
            <CardHeader className="p-3 pb-0">
              <CardDecorator>
                <MapPin className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-4 text-sm font-semibold">Geo-Fenced Voting</h3>
            </CardHeader>

            <CardContent className="p-3 pt-0">
              <p className="mt-3 text-sm">
                Only on-campus locations can cast valid votes. Location-based
                security that works.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none">
            <CardHeader className="p-3 pb-0">
              <CardDecorator>
                <BarChart3 className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-4 text-sm font-semibold">Real-Time Results</h3>
            </CardHeader>

            <CardContent className="p-3 pt-0">
              <p className="mt-3 text-sm">
                Track votes instantly and transparently. No waiting, no manual
                counting.
              </p>
            </CardContent>
          </Card>

        
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-50"
    />

    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);
