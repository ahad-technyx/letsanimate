import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="h-4 w-4 text-accent" />
          MotionPlan
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how" className="hover:text-foreground">
            How It Works
          </a>
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
        </nav>
        <Link href="/app">
          <Button size="sm">Open Workspace</Button>
        </Link>
      </div>
    </header>
  );
}
