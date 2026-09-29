import type { AnimationPlan } from "@/types/animation";
import { HeroPreview } from "./HeroPreview";
import { CardsPreview } from "./CardsPreview";
import { TextRevealPreview } from "./TextRevealPreview";
import { GalleryPreview } from "./GalleryPreview";
import { NavbarPreview } from "./NavbarPreview";
import { HorizontalScrollPreview } from "./HorizontalScrollPreview";
import { SubjectPreview } from "./SubjectPreview";

export type SceneKind =
  | "horizontal"
  | "navbar"
  | "gallery"
  | "text-reveal"
  | "cards"
  | "subject"
  | "hero";

export function pickPreviewScene(plan: AnimationPlan): SceneKind {
  const selectors = plan.elements.map((e) => e.selector).join(" ");
  if (/\.hscroll|\.hscroll-row|\.hscroll-item/.test(selectors)) return "horizontal";
  if (/\.navbar|\.nav-item/.test(selectors)) return "navbar";
  if (/\.gallery|\.gallery-item/.test(selectors)) return "gallery";
  // A subject-driven single-target plan wins over the generic hero fallback.
  if (
    plan.subject &&
    plan.elements.length === 1 &&
    /\.target\b/.test(plan.elements[0].selector)
  ) {
    return "subject";
  }
  if (/\.word/.test(selectors) && !/\.hero-img|\.cta|\.card\b/.test(selectors)) {
    return "text-reveal";
  }
  if (/\.card\b/.test(selectors) && !/\.hero-img|\bh1\b/.test(selectors)) {
    return "cards";
  }
  return "hero";
}

export function PreviewScene({ kind, plan }: { kind: SceneKind; plan: AnimationPlan }) {
  switch (kind) {
    case "horizontal":
      return <HorizontalScrollPreview plan={plan} />;
    case "navbar":
      return <NavbarPreview plan={plan} />;
    case "gallery":
      return <GalleryPreview plan={plan} />;
    case "text-reveal":
      return <TextRevealPreview plan={plan} />;
    case "cards":
      return <CardsPreview plan={plan} />;
    case "subject":
      return <SubjectPreview plan={plan} />;
    case "hero":
    default:
      return <HeroPreview plan={plan} />;
  }
}
