import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ContactSection() {
  return (
    <section id="contact" className="py-20">
      <div className="mx-auto max-w-4xl px-4 lg:px-0">
        <h1 className="mb-12 text-center text-3xl font-semibold lg:text-5xl">
          Help us route your inquiry
        </h1>

        <form action="" className="border px-4 py-12 lg:px-0 lg:py-24">
          <Card className="mx-auto max-w-lg p-8 sm:p-16">
            <h3 className="text-xl font-semibold">
              Request a Demo or Get Started
            </h3>
            <p className="mt-4 text-sm">
              Have a question or need a demo? Reach out to our team and
              we&apos;ll get back to you shortly.
            </p>

            <div className="**:[&>label]:block mt-12 space-y-6 *:space-y-3">
              <div>
                <Label htmlFor="name" className="space-y-2">
                  Full Name
                </Label>
                <Input type="text" id="name" required />
              </div>
              <div>
                <Label htmlFor="email" className="space-y-2">
                  Email Address
                </Label>
                <Input type="email" id="email" required />
              </div>
              <div>
                <Label htmlFor="country" className="space-y-2">
                  Institution/Organization
                </Label>
                <Input type="text" id="country" />
              </div>
              <div>
                <Label htmlFor="msg" className="space-y-2">
                  Message
                </Label>
                <Textarea id="msg" rows={3} />
              </div>
              <Button>Submit</Button>
            </div>
          </Card>
        </form>
      </div>
    </section>
  );
}
