"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-fade", {
        y: 14,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]
          bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.22),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0
          [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]
          [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)]"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center sm:py-36">
        <Badge variant="outline" className="hero-fade mb-6 border-border/70 text-muted-foreground">
          MotionPlan · Early Preview
        </Badge>
        <h1 className="hero-fade text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Turn animation ideas
          <br className="hidden sm:block" /> into production-ready code.
        </h1>
        <p className="hero-fade mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Describe an interaction, define the visual style, and MotionPlan creates the animation
          blueprint, timeline, preview, and implementation code.
        </p>
        <div className="hero-fade mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/app">
            <Button size="lg">
              Start Creating
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            <PlayCircle className="h-4 w-4" />
            See Example
          </Button>
        </div>
      </div>
    </section>
  );
}
