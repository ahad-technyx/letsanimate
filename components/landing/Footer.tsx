import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-accent" />
          MotionPlan
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/app" className="hover:text-foreground">
            Workspace
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} MotionPlan
        </p>
      </div>
    </footer>
  );
}
