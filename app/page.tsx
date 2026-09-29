import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ExampleAnimation } from "@/components/landing/ExampleAnimation";
import { DevSection } from "@/components/landing/DevSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "MotionPlan — Turn Animation Ideas Into Production-Ready Code",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <ExampleAnimation />
      <DevSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
