import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to plan your next animation?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          Start with a prompt, ship code. No boilerplate, no guesswork.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/app">
            <Button size="lg">
              Open the Workspace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Read the Docs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
