import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Docs · MotionPlan",
  description: "Documentation for MotionPlan — animation planning, GSAP integration, and API.",
};

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
      <p className="mt-3 text-muted-foreground">
        MotionPlan docs are coming soon. This page will explain animation planning, GSAP
        integration, and API usage.
      </p>
    </main>
  );
}
