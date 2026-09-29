import type {
  AnimationElement,
  AnimationFramework,
  AnimationPlan,
  AnimationTrigger,
  Easing,
} from "@/types/animation";
import { normalizePlan } from "./utils";

interface PresetContext {
  framework: AnimationFramework;
  trigger: AnimationTrigger;
  ease: Easing;
}

const DEFAULT_CTX: PresetContext = {
  framework: "gsap",
  trigger: { type: "onLoad" },
  ease: "power3.out",
};

const SCROLL_CTX: PresetContext = {
  framework: "gsap-scrolltrigger",
  trigger: {
    type: "onScroll",
    scrollTrigger: {
      trigger: ".section",
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
    },
  },
  ease: "none",
};

const IN_VIEW_CTX: PresetContext = {
  framework: "gsap-scrolltrigger",
  trigger: {
    type: "onInView",
    selector: ".section",
    threshold: 0.2,
  },
  ease: "power2.out",
};

function makePlan({
  id,
  title,
  description,
  ctx,
  elements,
  style = "premium",
}: {
  id: string;
  title: string;
  description: string;
  elements: AnimationElement[];
  ctx?: PresetContext;
  style?: AnimationPlan["style"];
}): AnimationPlan {
  const c = ctx ?? DEFAULT_CTX;
  return normalizePlan({
    id,
    title,
    description,
    style,
    trigger: c.trigger,
    framework: c.framework,
    ease: c.ease,
    elements,
    duration: 0, // recomputed by normalizePlan
    timeline: [],
    responsive: { reducedMotion: "respect" },
    accessibility: { respectReducedMotion: true, focusManagement: "preserve" },
    performance: {
      gpuAccelerated: true,
      willChange: ["transform", "opacity"],
    },
  });
}

function createFadeUp(): AnimationPlan {
  return makePlan({
    id: "preset_fade_up",
    title: "Fade Up",
    description: "Element fades upward into place.",
    elements: [
      {
        id: "el_target",
        selector: ".target",
        label: "Target",
        from: { opacity: 0, y: 24 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.6, delay: 0, ease: "power3.out" },
      },
    ],
  });
}

function createFadeDown(): AnimationPlan {
  return makePlan({
    id: "preset_fade_down",
    title: "Fade Down",
    description: "Element fades downward into place.",
    elements: [
      {
        id: "el_target",
        selector: ".target",
        label: "Target",
        from: { opacity: 0, y: -24 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.6, delay: 0, ease: "power3.out" },
      },
    ],
  });
}

function createFadeLeft(): AnimationPlan {
  return makePlan({
    id: "preset_fade_left",
    title: "Fade Left",
    description: "Element fades in from the right.",
    elements: [
      {
        id: "el_target",
        selector: ".target",
        label: "Target",
        from: { opacity: 0, x: 24 },
        to: { opacity: 1, x: 0 },
        timing: { duration: 0.6, delay: 0, ease: "power3.out" },
      },
    ],
  });
}

function createFadeRight(): AnimationPlan {
  return makePlan({
    id: "preset_fade_right",
    title: "Fade Right",
    description: "Element fades in from the left.",
    elements: [
      {
        id: "el_target",
        selector: ".target",
        label: "Target",
        from: { opacity: 0, x: -24 },
        to: { opacity: 1, x: 0 },
        timing: { duration: 0.6, delay: 0, ease: "power3.out" },
      },
    ],
  });
}

function createScaleIn(): AnimationPlan {
  return makePlan({
    id: "preset_scale_in",
    title: "Scale In",
    description: "Element scales from 0.92 to 1 with a fade.",
    style: "playful",
    elements: [
      {
        id: "el_target",
        selector: ".target",
        label: "Target",
        from: { opacity: 0, scale: 0.92 },
        to: { opacity: 1, scale: 1 },
        timing: { duration: 0.5, delay: 0, ease: "back.out" },
      },
    ],
  });
}

function createTextReveal(): AnimationPlan {
  return makePlan({
    id: "preset_text_reveal",
    title: "Text Reveal",
    description: "Words reveal one after another with a stagger.",
    style: "cinematic",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Words",
        from: { opacity: 0, y: 16 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.55, delay: 0, stagger: 0.08, ease: "power3.out" },
      },
    ],
  });
}

function createStaggerCards(): AnimationPlan {
  return makePlan({
    id: "preset_stagger_cards",
    title: "Stagger Cards",
    description: "Cards animate in one after another when visible.",
    style: "premium",
    ctx: {
      framework: "gsap-scrolltrigger",
      trigger: {
        type: "onInView",
        selector: ".cards",
        threshold: 0.2,
      },
      ease: "power2.out",
    },
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, y: 24 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.6, delay: 0, stagger: 0.12, ease: "power2.out" },
      },
    ],
  });
}

function createParallax(): AnimationPlan {
  return makePlan({
    id: "preset_parallax",
    title: "Parallax",
    description: "Background element drifts on scroll for depth.",
    style: "cinematic",
    ctx: SCROLL_CTX,
    elements: [
      {
        id: "el_bg",
        selector: ".parallax-bg",
        label: "Background layer",
        from: { y: 0 },
        to: { y: -120 },
        timing: { duration: 1, delay: 0, ease: "none" },
      },
    ],
  });
}

function createPinSection(): AnimationPlan {
  return makePlan({
    id: "preset_pin_section",
    title: "Pin Section",
    description: "Section pins while its content animates through.",
    style: "cinematic",
    ctx: {
      framework: "gsap-scrolltrigger",
      trigger: {
        type: "onScroll",
        scrollTrigger: {
          trigger: ".section",
          start: "top top",
          end: "+=800",
          pin: true,
          scrub: true,
        },
      },
      ease: "none",
    },
    elements: [
      {
        id: "el_content",
        selector: ".pinned-content",
        label: "Pinned content",
        from: { opacity: 0, y: 40 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 1, delay: 0, ease: "none" },
      },
    ],
  });
}

function createHorizontalScroll(): AnimationPlan {
  return makePlan({
    id: "preset_horizontal_scroll",
    title: "Horizontal Scroll",
    description: "Row translates horizontally while the page scrolls vertically.",
    style: "experimental",
    ctx: {
      framework: "gsap-scrolltrigger",
      trigger: {
        type: "onScroll",
        scrollTrigger: {
          trigger: ".hscroll",
          start: "top top",
          end: "+=1500",
          pin: true,
          scrub: 1,
        },
      },
      ease: "none",
    },
    elements: [
      {
        id: "el_row",
        selector: ".hscroll-row",
        label: "Row",
        from: { x: 0 },
        to: { x: "-75%" },
        timing: { duration: 1.5, delay: 0, ease: "none" },
      },
    ],
  });
}

/* ────────────────────────────── Heading catalog ──────────────────────────────
 * Target `.word` — the HeroPreview wraps every word of the heading in a `.word`
 * span, so these presets naturally produce per-word motion on the title.
 */

function createHeadingSplitStagger(): AnimationPlan {
  return makePlan({
    id: "preset_heading_split_stagger",
    title: "Heading · Split Stagger",
    description: "Each word rises into place one after another.",
    style: "premium",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Heading words",
        from: { opacity: 0, y: 28 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.55, delay: 0, stagger: 0.09, ease: "power3.out" },
      },
    ],
  });
}

function createHeadingBlurIn(): AnimationPlan {
  return makePlan({
    id: "preset_heading_blur_in",
    title: "Heading · Blur In",
    description: "Words focus into view with a fading blur.",
    style: "cinematic",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Heading words",
        from: { opacity: 0, filter: "blur(10px)" },
        to: { opacity: 1, filter: "blur(0px)" },
        timing: { duration: 0.7, delay: 0, stagger: 0.07, ease: "power2.out" },
      },
    ],
  });
}

function createHeadingRiseScale(): AnimationPlan {
  return makePlan({
    id: "preset_heading_rise_scale",
    title: "Heading · Rise & Scale",
    description: "Words rise from below while scaling up to full size.",
    style: "premium",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Heading words",
        from: { opacity: 0, y: 40, scale: 0.85 },
        to: { opacity: 1, y: 0, scale: 1 },
        timing: { duration: 0.7, delay: 0, stagger: 0.08, ease: "back.out" },
      },
    ],
  });
}

function createHeadingSkewSlide(): AnimationPlan {
  return makePlan({
    id: "preset_heading_skew_slide",
    title: "Heading · Skew Slide",
    description: "Words slide in from the left with a subtle skew.",
    style: "experimental",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Heading words",
        from: { opacity: 0, x: -60, skewX: -12 },
        to: { opacity: 1, x: 0, skewX: 0 },
        timing: { duration: 0.6, delay: 0, stagger: 0.08, ease: "power3.out" },
      },
    ],
  });
}

function createHeadingRotateIn(): AnimationPlan {
  return makePlan({
    id: "preset_heading_rotate_in",
    title: "Heading · Rotate In",
    description: "Words rotate into place from a slight tilt.",
    style: "playful",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Heading words",
        from: { opacity: 0, y: 24, rotation: -8 },
        to: { opacity: 1, y: 0, rotation: 0 },
        timing: { duration: 0.6, delay: 0, stagger: 0.08, ease: "back.out" },
      },
    ],
  });
}

function createHeadingLetterCascade(): AnimationPlan {
  return makePlan({
    id: "preset_heading_letter_cascade",
    title: "Heading · Letter Cascade",
    description: "A quick, tight cascade of words for a snappy reveal.",
    style: "fast",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Heading words",
        from: { opacity: 0, y: 12 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.35, delay: 0, stagger: 0.04, ease: "power1.out" },
      },
    ],
  });
}

function createHeadingGradientSweep(): AnimationPlan {
  return makePlan({
    id: "preset_heading_gradient_sweep",
    title: "Heading · Gradient Sweep",
    description: "Words desaturate into full color as they enter.",
    style: "cinematic",
    elements: [
      {
        id: "el_words",
        selector: ".word",
        label: "Heading words",
        from: { opacity: 0, y: 16, filter: "grayscale(1) brightness(0.6)" },
        to: { opacity: 1, y: 0, filter: "grayscale(0) brightness(1)" },
        timing: { duration: 0.7, delay: 0, stagger: 0.09, ease: "power2.out" },
      },
    ],
  });
}

/* ─────────────────────────── Boxes / Cards catalog ───────────────────────────
 * Target `.card` — HeroPreview renders a 3-card grid inside `.cards`.
 */

function createCardsFlipIn(): AnimationPlan {
  return makePlan({
    id: "preset_cards_flip_in",
    title: "Boxes · Flip In",
    description: "Cards flip upright from a tilted-forward position.",
    style: "premium",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, y: 30, rotation: -12, transformOrigin: "bottom center" },
        to: { opacity: 1, y: 0, rotation: 0 },
        timing: { duration: 0.65, delay: 0, stagger: 0.12, ease: "back.out" },
      },
    ],
  });
}

function createCardsTilt3D(): AnimationPlan {
  return makePlan({
    id: "preset_cards_tilt_3d",
    title: "Boxes · 3D Tilt",
    description: "Cards settle with a skew-based faux-3D tilt.",
    style: "experimental",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, y: 24, skewY: 8, scale: 0.9 },
        to: { opacity: 1, y: 0, skewY: 0, scale: 1 },
        timing: { duration: 0.7, delay: 0, stagger: 0.1, ease: "power3.out" },
      },
    ],
  });
}

function createCardsScaleBounce(): AnimationPlan {
  return makePlan({
    id: "preset_cards_scale_bounce",
    title: "Boxes · Scale Bounce",
    description: "Cards pop in with a springy overshoot.",
    style: "playful",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, scale: 0.6 },
        to: { opacity: 1, scale: 1 },
        timing: { duration: 0.55, delay: 0, stagger: 0.1, ease: "back.out(2)" },
      },
    ],
  });
}

function createCardsSlideLeft(): AnimationPlan {
  return makePlan({
    id: "preset_cards_slide_left",
    title: "Boxes · Slide From Left",
    description: "Cards glide in from the left with a stagger.",
    style: "smooth",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, x: -80 },
        to: { opacity: 1, x: 0 },
        timing: { duration: 0.6, delay: 0, stagger: 0.12, ease: "power3.out" },
      },
    ],
  });
}

function createCardsGlowIn(): AnimationPlan {
  return makePlan({
    id: "preset_cards_glow_in",
    title: "Boxes · Glow In",
    description: "Cards fade in with a soft glow that settles.",
    style: "cinematic",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: {
          opacity: 0,
          y: 20,
          filter: "drop-shadow(0 0 24px rgba(99,102,241,0.65)) blur(4px)",
        },
        to: { opacity: 1, y: 0, filter: "drop-shadow(0 0 0 rgba(99,102,241,0)) blur(0px)" },
        timing: { duration: 0.75, delay: 0, stagger: 0.11, ease: "power2.out" },
      },
    ],
  });
}

function createCardsSkewSlide(): AnimationPlan {
  return makePlan({
    id: "preset_cards_skew_slide",
    title: "Boxes · Skew Slide",
    description: "Cards slide up with a stylized skew that resolves.",
    style: "experimental",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, y: 48, skewX: -10 },
        to: { opacity: 1, y: 0, skewX: 0 },
        timing: { duration: 0.6, delay: 0, stagger: 0.1, ease: "power3.out" },
      },
    ],
  });
}

function createCardsRotateReveal(): AnimationPlan {
  return makePlan({
    id: "preset_cards_rotate_reveal",
    title: "Boxes · Rotate Reveal",
    description: "Cards rotate in from a corner pivot.",
    style: "playful",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_cards",
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, scale: 0.85, rotation: -14, transformOrigin: "top left" },
        to: { opacity: 1, scale: 1, rotation: 0 },
        timing: { duration: 0.6, delay: 0, stagger: 0.1, ease: "back.out" },
      },
    ],
  });
}

/* ──────────────────────────── Section / Page catalog ─────────────────────────
 * Target `.section`, `.parallax-bg`, or `.pinned-content` — HeroPreview
 * provides all three so these presets render with visible motion.
 */

function createSectionFadeIn(): AnimationPlan {
  return makePlan({
    id: "preset_section_fade_in",
    title: "Section · Fade In",
    description: "The whole section fades in as it enters the viewport.",
    style: "smooth",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_section",
        selector: ".section",
        label: "Section",
        from: { opacity: 0, y: 40 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.9, delay: 0, ease: "power2.out" },
      },
    ],
  });
}

function createSectionScaleIn(): AnimationPlan {
  return makePlan({
    id: "preset_section_scale_in",
    title: "Section · Scale In",
    description: "The section eases up from 96% while fading in.",
    style: "cinematic",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_section",
        selector: ".section",
        label: "Section",
        from: { opacity: 0, scale: 0.96 },
        to: { opacity: 1, scale: 1 },
        timing: { duration: 0.9, delay: 0, ease: "power3.out" },
      },
    ],
  });
}

function createSectionCurtain(): AnimationPlan {
  return makePlan({
    id: "preset_section_curtain",
    title: "Section · Curtain Reveal",
    description: "A dark curtain lifts as the section eases in.",
    style: "cinematic",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_section",
        selector: ".section",
        label: "Section",
        from: { opacity: 0, y: 60, filter: "brightness(0.3)" },
        to: { opacity: 1, y: 0, filter: "brightness(1)" },
        timing: { duration: 1.1, delay: 0, ease: "power4.out" },
      },
    ],
  });
}

function createSectionBlurFocus(): AnimationPlan {
  return makePlan({
    id: "preset_section_blur_focus",
    title: "Section · Blur Focus",
    description: "The section sharpens from a heavy blur into focus.",
    style: "cinematic",
    ctx: IN_VIEW_CTX,
    elements: [
      {
        id: "el_section",
        selector: ".section",
        label: "Section",
        from: { opacity: 0, filter: "blur(18px)" },
        to: { opacity: 1, filter: "blur(0px)" },
        timing: { duration: 1, delay: 0, ease: "power2.out" },
      },
    ],
  });
}

function createSectionParallaxLayers(): AnimationPlan {
  return makePlan({
    id: "preset_section_parallax_layers",
    title: "Section · Parallax Layers",
    description: "Background drifts up while the section fades in.",
    style: "cinematic",
    ctx: SCROLL_CTX,
    elements: [
      {
        id: "el_bg",
        selector: ".parallax-bg",
        label: "Background layer",
        from: { y: 0, scale: 1.1 },
        to: { y: -160, scale: 1 },
        timing: { duration: 1, delay: 0, ease: "none" },
      },
      {
        id: "el_section_content",
        selector: ".pinned-content",
        label: "Foreground",
        from: { y: 60, opacity: 0 },
        to: { y: 0, opacity: 1 },
        timing: { duration: 1, delay: 0.05, ease: "none" },
      },
    ],
  });
}

function createSectionSlideStack(): AnimationPlan {
  return makePlan({
    id: "preset_section_slide_stack",
    title: "Section · Slide Stack",
    description: "Section pins while content slides up and settles.",
    style: "premium",
    ctx: {
      framework: "gsap-scrolltrigger",
      trigger: {
        type: "onScroll",
        scrollTrigger: {
          trigger: ".section",
          start: "top top",
          end: "+=600",
          pin: true,
          scrub: 0.6,
        },
      },
      ease: "power2.out",
    },
    elements: [
      {
        id: "el_section_content",
        selector: ".pinned-content",
        label: "Pinned content",
        from: { opacity: 0, y: 80, scale: 0.95 },
        to: { opacity: 1, y: 0, scale: 1 },
        timing: { duration: 1, delay: 0, ease: "power2.out" },
      },
    ],
  });
}

export type PresetCategory = "heading" | "boxes" | "section" | "generic";

export interface PresetDescriptor {
  id: string;
  label: string;
  category: PresetCategory;
  build: () => AnimationPlan;
}

export const PRESETS: PresetDescriptor[] = [
  // Generic — legacy presets kept for backwards compat and simple use cases.
  { id: "preset_fade_up", label: "Fade Up", category: "generic", build: createFadeUp },
  { id: "preset_fade_down", label: "Fade Down", category: "generic", build: createFadeDown },
  { id: "preset_fade_left", label: "Fade Left", category: "generic", build: createFadeLeft },
  { id: "preset_fade_right", label: "Fade Right", category: "generic", build: createFadeRight },
  { id: "preset_scale_in", label: "Scale In", category: "generic", build: createScaleIn },
  { id: "preset_text_reveal", label: "Text Reveal", category: "generic", build: createTextReveal },
  {
    id: "preset_stagger_cards",
    label: "Stagger Cards",
    category: "generic",
    build: createStaggerCards,
  },
  { id: "preset_parallax", label: "Parallax", category: "generic", build: createParallax },
  { id: "preset_pin_section", label: "Pin Section", category: "generic", build: createPinSection },
  {
    id: "preset_horizontal_scroll",
    label: "Horizontal Scroll",
    category: "generic",
    build: createHorizontalScroll,
  },

  // Heading catalog
  {
    id: "preset_heading_split_stagger",
    label: "Split Stagger",
    category: "heading",
    build: createHeadingSplitStagger,
  },
  {
    id: "preset_heading_blur_in",
    label: "Blur In",
    category: "heading",
    build: createHeadingBlurIn,
  },
  {
    id: "preset_heading_rise_scale",
    label: "Rise & Scale",
    category: "heading",
    build: createHeadingRiseScale,
  },
  {
    id: "preset_heading_skew_slide",
    label: "Skew Slide",
    category: "heading",
    build: createHeadingSkewSlide,
  },
  {
    id: "preset_heading_rotate_in",
    label: "Rotate In",
    category: "heading",
    build: createHeadingRotateIn,
  },
  {
    id: "preset_heading_letter_cascade",
    label: "Letter Cascade",
    category: "heading",
    build: createHeadingLetterCascade,
  },
  {
    id: "preset_heading_gradient_sweep",
    label: "Gradient Sweep",
    category: "heading",
    build: createHeadingGradientSweep,
  },

  // Boxes / Cards catalog
  {
    id: "preset_cards_flip_in",
    label: "Flip In",
    category: "boxes",
    build: createCardsFlipIn,
  },
  { id: "preset_cards_tilt_3d", label: "3D Tilt", category: "boxes", build: createCardsTilt3D },
  {
    id: "preset_cards_scale_bounce",
    label: "Scale Bounce",
    category: "boxes",
    build: createCardsScaleBounce,
  },
  {
    id: "preset_cards_slide_left",
    label: "Slide From Left",
    category: "boxes",
    build: createCardsSlideLeft,
  },
  { id: "preset_cards_glow_in", label: "Glow In", category: "boxes", build: createCardsGlowIn },
  {
    id: "preset_cards_skew_slide",
    label: "Skew Slide",
    category: "boxes",
    build: createCardsSkewSlide,
  },
  {
    id: "preset_cards_rotate_reveal",
    label: "Rotate Reveal",
    category: "boxes",
    build: createCardsRotateReveal,
  },

  // Section / Page catalog
  {
    id: "preset_section_fade_in",
    label: "Fade In",
    category: "section",
    build: createSectionFadeIn,
  },
  {
    id: "preset_section_scale_in",
    label: "Scale In",
    category: "section",
    build: createSectionScaleIn,
  },
  {
    id: "preset_section_curtain",
    label: "Curtain Reveal",
    category: "section",
    build: createSectionCurtain,
  },
  {
    id: "preset_section_blur_focus",
    label: "Blur Focus",
    category: "section",
    build: createSectionBlurFocus,
  },
  {
    id: "preset_section_parallax_layers",
    label: "Parallax Layers",
    category: "section",
    build: createSectionParallaxLayers,
  },
  {
    id: "preset_section_slide_stack",
    label: "Slide Stack",
    category: "section",
    build: createSectionSlideStack,
  },
];

export const PRESET_CATEGORY_LABELS: Record<PresetCategory, string> = {
  heading: "Heading",
  boxes: "Boxes & Cards",
  section: "Section / Page",
  generic: "Generic",
};

// `generic` presets are still built (mock provider + templates reference them
// by id) but are intentionally omitted here so they don't appear in the picker.
export const PRESET_CATEGORY_ORDER: PresetCategory[] = ["heading", "boxes", "section"];

export function getPresetById(id: string): PresetDescriptor | undefined {
  return PRESETS.find((p) => p.id === id);
}
