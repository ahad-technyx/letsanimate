import type { AnimationPlan } from "@/types/animation";
import { normalizePlan } from "./utils";

/**
 * Hero Cinematic Entrance — the deterministic Phase 2 sample:
 *   Heading  0.0 → 0.8
 *   Image    0.4 → 1.4
 *   CTA      1.0 → 1.6
 *   Cards    1.4 → 2.2
 */
export const HERO_CINEMATIC_ENTRANCE: AnimationPlan = normalizePlan({
  id: "sample_hero_cinematic",
  title: "Hero Cinematic Entrance",
  description:
    "A premium hero reveal — the heading fades up, the image cross-fades, the CTA lifts, and cards stagger in.",
  style: "cinematic",
  trigger: { type: "onLoad" },
  framework: "gsap",
  duration: 2.2,
  ease: "power3.out",
  elements: [
    {
      id: "el_heading",
      selector: "h1",
      label: "Hero heading",
      from: { opacity: 0, y: 24 },
      to: { opacity: 1, y: 0 },
      timing: { duration: 0.8, delay: 0, ease: "power3.out" },
    },
    {
      id: "el_image",
      selector: ".hero-img",
      label: "Hero image",
      from: { opacity: 0, scale: 1.04 },
      to: { opacity: 1, scale: 1 },
      timing: { duration: 1.0, delay: 0.4, ease: "power2.out" },
    },
    {
      id: "el_cta",
      selector: ".cta",
      label: "CTA",
      from: { opacity: 0, y: 12 },
      to: { opacity: 1, y: 0 },
      timing: { duration: 0.6, delay: 1.0, ease: "back.out" },
    },
    {
      id: "el_cards",
      selector: ".card",
      label: "Cards",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0 },
      timing: { duration: 0.8, delay: 1.4, stagger: 0.12, ease: "power2.out" },
    },
  ],
  timeline: [],
  responsive: { reducedMotion: "respect", disableBelow: 480 },
  accessibility: { respectReducedMotion: true, focusManagement: "preserve" },
  performance: {
    gpuAccelerated: true,
    willChange: ["transform", "opacity"],
    notes: ["Uses transform + opacity only — GPU compositor path."],
  },
});
