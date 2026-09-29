import type { AnimationPlan } from "@/types/animation";
import { normalizePlan } from "@/lib/animation/utils";
import { HERO_CINEMATIC_ENTRANCE } from "@/lib/animation/samples";
import { getPresetById } from "@/lib/animation/presets";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  build: () => AnimationPlan;
}

function blank(): AnimationPlan {
  return normalizePlan({
    id: "plan_blank",
    title: "Untitled",
    description: "",
    style: "premium",
    trigger: { type: "onLoad" },
    framework: "gsap",
    ease: "power3.out",
    duration: 0,
    elements: [
      {
        id: "el_target",
        selector: ".target",
        label: "Target",
        from: { opacity: 0, y: 20 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.6, delay: 0, ease: "power3.out" },
      },
    ],
    timeline: [],
    responsive: { reducedMotion: "respect" },
    accessibility: { respectReducedMotion: true, focusManagement: "preserve" },
    performance: {
      gpuAccelerated: true,
      willChange: ["transform", "opacity"],
      notes: ["Transform + opacity only."],
    },
  });
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  { id: "blank", name: "Blank", description: "One element ready to animate.", build: blank },
  {
    id: "fade-up",
    name: "Fade Up",
    description: "Simple fade + slide up.",
    build: () => getPresetById("preset_fade_up")!.build(),
  },
  {
    id: "text-reveal",
    name: "Text Reveal",
    description: "Reveal a heading word by word.",
    build: () => getPresetById("preset_text_reveal")!.build(),
  },
  {
    id: "stagger-cards",
    name: "Stagger Cards",
    description: "Cards animate in one after another on scroll.",
    build: () => getPresetById("preset_stagger_cards")!.build(),
  },
  {
    id: "cinematic-hero",
    name: "Cinematic Hero",
    description: "Heading, image, CTA, cards — the full reveal.",
    build: () => ({ ...HERO_CINEMATIC_ENTRANCE }),
  },
  {
    id: "horizontal-scroll",
    name: "Horizontal Scroll",
    description: "Pin the section, scrub a row sideways.",
    build: () => getPresetById("preset_horizontal_scroll")!.build(),
  },
  {
    id: "three-cube",
    name: "3D · Rotating Cube",
    description: "A Three.js cube tumbling into place. WebGL preview.",
    build: () => getPresetById("preset_3d_cube_spin")!.build(),
  },
  {
    id: "three-particles",
    name: "3D · Particle Field",
    description: "A cloud of particles blooming from the origin.",
    build: () => getPresetById("preset_3d_particles_reveal")!.build(),
  },
  {
    id: "three-gallery",
    name: "3D · Gallery Orbit",
    description: "A ring of cards spinning into a hero orbit.",
    build: () => getPresetById("preset_3d_gallery_orbit")!.build(),
  },
];

export function getTemplate(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}
