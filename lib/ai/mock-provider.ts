import type { AIPlanRequest, AIPlanResponse } from "@/types/ai";
import type {
  AnimationElement,
  AnimationFramework,
  AnimationPlan,
  AnimationStyle,
  AnimationTrigger,
  Easing,
  TriggerKind,
} from "@/types/animation";
import { normalizePlan } from "@/lib/animation/utils";
import { getPresetById } from "@/lib/animation/presets";
import { detectSubject } from "@/lib/animation/subjects";
import type { AIProvider } from "./provider";

function triggerFor(kind: TriggerKind | undefined): AnimationTrigger {
  switch (kind) {
    case "onScroll":
      return {
        type: "onScroll",
        scrollTrigger: { trigger: ".section", start: "top 80%", end: "bottom 20%" },
      };
    case "onHover":
      return { type: "onHover", selector: ".target" };
    case "onClick":
      return { type: "onClick", selector: ".target" };
    case "onInView":
      return { type: "onInView", selector: ".target", threshold: 0.2 };
    case "onLoad":
    default:
      return { type: "onLoad" };
  }
}

function easeForStyle(style: AnimationStyle | undefined): Easing {
  switch (style) {
    case "playful":
      return "back.out";
    case "fast":
      return "power2.out";
    case "corporate":
      return "power2.inOut";
    case "smooth":
      return "power1.inOut";
    case "experimental":
      return "expo.out";
    case "cinematic":
    case "premium":
    case "minimal":
    default:
      return "power3.out";
  }
}

function deriveTitle(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "Generated Animation";
  const words = trimmed.split(/\s+/).slice(0, 6).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Deterministic, keyword-driven mock. Produces a valid AnimationPlan
 * without any external service. Runs whenever AI_API_KEY is unset.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock" as const;

  async generatePlan(req: AIPlanRequest): Promise<AIPlanResponse> {
    // Simulate a small latency so the loading UX is visible.
    await new Promise((r) => setTimeout(r, 700));

    if ((req.mode ?? "2d") === "3d") {
      return this.generate3DPlan(req);
    }

    const prompt = (req.prompt ?? "").toLowerCase();
    const style = req.style ?? "premium";
    const requestedTrigger = req.trigger;
    const requestedFramework: AnimationFramework = req.framework ?? "gsap";

    // Preset short-circuits
    if (/horizontal/.test(prompt) && /scroll/.test(prompt)) {
      const plan = getPresetById("preset_horizontal_scroll")!.build();
      return { plan: { ...plan, description: req.prompt || plan.description } };
    }
    if (/\bpin(?:ned|ning)?\b/.test(prompt) && !/(heading|image|cards|cta)/.test(prompt)) {
      const plan = getPresetById("preset_pin_section")!.build();
      return { plan: { ...plan, description: req.prompt || plan.description } };
    }
    if (/parallax/.test(prompt)) {
      const plan = getPresetById("preset_parallax")!.build();
      return { plan: { ...plan, description: req.prompt || plan.description } };
    }

    const isScroll = requestedTrigger === "onScroll" || /\bscroll\b|as you scroll/.test(prompt);
    const framework: AnimationFramework =
      isScroll && (requestedFramework === "gsap" || requestedFramework === "gsap-scrolltrigger")
        ? "gsap-scrolltrigger"
        : requestedFramework;
    const trigger: AnimationTrigger = triggerFor(isScroll ? "onScroll" : requestedTrigger);

    const ease = easeForStyle(style);

    // ── Subject-driven plan ──────────────────────────────────────────────
    // If the prompt names a concrete subject (car, rocket, star, an emoji…),
    // build a single `.target` plan and pipe the detected motion verbs into
    // its transforms. SubjectPreview renders the subject in place of the
    // generic hero scene.
    const subject = detectSubject(req.prompt);
    if (subject) {
      const wantsRotate =
        /\brotat(?:e|es|ed|ing|ion|ions)\b|\bspin(?:s|ning|ned)?\b|\bswirl(?:s|ing|ed)?\b|\bwhirl(?:s|ing|ed)?\b/.test(
          prompt,
        );
      const wantsScale =
        /\bscal(?:e|es|ed|ing)\b|\bgrow(?:s|ing|n)?\b|\bshrink(?:s|ing|age)?\b|\bzoom(?:s|ing|ed)?\b/.test(
          prompt,
        );
      const wantsMove =
        /\bmov(?:e|es|ed|ing)\b|\bslid(?:e|es|ing)\b|\btranslat(?:e|es|ed|ing)\b|\bdrift(?:s|ing|ed)?\b|\bflow(?:s|ing|ed)?\b|\bfly(?:ing)?\b|\bflew\b|\bfloat(?:s|ing|ed)?\b/.test(
          prompt,
        );
      const wantsFade = /\bfad(?:e|es|ed|ing)\b/.test(prompt);
      const wantsBounce =
        /\bbounc(?:e|es|ed|ing)\b|\bhop(?:s|ped|ping)?\b|\bjump(?:s|ed|ing)?\b/.test(prompt);
      const dirRight = /\bright\b/.test(prompt);
      const dirLeft = /\bleft\b/.test(prompt);
      const dirUp = /\bup\b|\bupward/.test(prompt);
      const dirDown = /\bdown\b|\bdownward/.test(prompt);
      const counter = /\b(counter|reverse|anti|backwards?|ccw)\b/.test(prompt);

      const from: AnimationElement["from"] = {};
      const to: AnimationElement["to"] = {};

      if (wantsRotate) {
        from.rotation = 0;
        to.rotation = counter ? -360 : 360;
      }
      if (wantsScale) {
        const shrink = /\bshrink|\bsmaller/.test(prompt);
        from.scale = shrink ? 1 : 0.7;
        to.scale = shrink ? 0.7 : 1;
      }
      if (wantsMove || dirRight || dirLeft || dirUp || dirDown) {
        if (dirRight) {
          from.x = -80;
          to.x = 0;
        } else if (dirLeft) {
          from.x = 80;
          to.x = 0;
        } else if (dirUp) {
          from.y = 60;
          to.y = 0;
        } else if (dirDown) {
          from.y = -60;
          to.y = 0;
        } else {
          from.x = -60;
          to.x = 0;
        }
      }
      if (wantsBounce) {
        from.y = 40;
        to.y = 0;
      }
      // Default to a fade if the prompt says "fade" or nothing else was detected.
      if (wantsFade || (Object.keys(from).length === 0 && Object.keys(to).length === 0)) {
        from.opacity = 0;
        to.opacity = 1;
      }

      const rotationOnly = wantsRotate && !wantsScale && !wantsMove && !wantsFade && !wantsBounce;
      const duration = rotationOnly ? (isScroll ? 1.5 : 2.5) : 1;
      const elementEase = isScroll
        ? "none"
        : wantsBounce
          ? "bounce.out"
          : wantsRotate && rotationOnly
            ? "none"
            : ease;

      const el: AnimationElement = {
        id: uid("el_target"),
        selector: ".target",
        label: subject.label ?? subject.value,
        from,
        to,
        timing: { duration, delay: 0, ease: elementEase, ...(wantsRotate && rotationOnly && !isScroll ? { repeat: -1 } : {}) },
      };

      const now = new Date().toISOString();
      const plan: AnimationPlan = normalizePlan({
        id: uid("plan"),
        title: deriveTitle(req.prompt),
        description: req.prompt.trim() || "Generated animation plan.",
        style,
        trigger,
        framework,
        duration: 0,
        ease,
        elements: [el],
        timeline: [],
        responsive: { reducedMotion: "respect" },
        accessibility: { respectReducedMotion: true, focusManagement: "preserve" },
        performance: {
          gpuAccelerated: true,
          willChange: ["transform", "opacity"],
          notes: ["Uses transform + opacity only — GPU compositor path."],
        },
        subject: { kind: subject.kind, value: subject.value, label: subject.label },
        createdAt: now,
        updatedAt: now,
      });

      const warnings: string[] = [];
      if (req.screenshots && req.screenshots.length > 0) {
        warnings.push(
          `Mock provider does not analyze images — ${req.screenshots.length} screenshot${req.screenshots.length === 1 ? "" : "s"} ignored. Configure AI_API_KEY for vision.`,
        );
      }
      return {
        plan,
        reasoning: `Detected subject "${subject.value}" and motion keywords.`,
        warnings: warnings.length ? warnings : undefined,
      };
    }

    const elements: AnimationElement[] = [];
    let cursor = 0;

    const wantsHeading = /(heading|title|hero text|h1)/.test(prompt);
    const wordReveal = /(word by word|text reveal|word-by-word|words? reveal)/.test(prompt);
    const wantsImage = /(image|picture|photo|\bimg\b|figure)/.test(prompt);
    const wantsCta = /(cta|button|call to action)/.test(prompt);
    const wantsCards = /(cards?|tiles?|grid items?)/.test(prompt);

    if (wantsHeading || wordReveal) {
      if (wordReveal) {
        elements.push({
          id: uid("el_heading"),
          selector: "h1 .word",
          label: "Heading words",
          from: { opacity: 0, y: 20 },
          to: { opacity: 1, y: 0 },
          timing: { duration: 0.55, delay: cursor, stagger: 0.08, ease: "power3.out" },
        });
        cursor += 0.9;
      } else {
        elements.push({
          id: uid("el_heading"),
          selector: "h1",
          label: "Heading",
          from: { opacity: 0, y: 24 },
          to: { opacity: 1, y: 0 },
          timing: { duration: 0.7, delay: cursor, ease },
        });
        cursor += 0.4;
      }
    }
    if (wantsImage) {
      const fromRight = /from the right/.test(prompt);
      const fromLeft = /from the left/.test(prompt);
      const withScale = /scale/.test(prompt);
      const from: AnimationElement["from"] = { opacity: 0 };
      if (fromRight) from.x = 40;
      else if (fromLeft) from.x = -40;
      if (withScale) from.scale = 1.04;
      const to: AnimationElement["to"] = { opacity: 1, x: 0 };
      if (withScale) to.scale = 1;
      elements.push({
        id: uid("el_image"),
        selector: ".hero-img",
        label: "Hero image",
        from,
        to,
        timing: { duration: 0.9, delay: cursor, ease },
      });
      cursor += 0.5;
    }
    if (wantsCta) {
      elements.push({
        id: uid("el_cta"),
        selector: ".cta",
        label: "CTA",
        from: { opacity: 0, y: 12 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.5, delay: cursor, ease: "back.out" },
      });
      cursor += 0.4;
    }
    if (wantsCards) {
      elements.push({
        id: uid("el_cards"),
        selector: ".card",
        label: "Cards",
        from: { opacity: 0, y: 20 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.6, delay: cursor, stagger: 0.12, ease: "power2.out" },
      });
    }

    // Fallback: generic fade up
    if (elements.length === 0) {
      elements.push({
        id: uid("el_target"),
        selector: ".target",
        label: "Target",
        from: { opacity: 0, y: 20 },
        to: { opacity: 1, y: 0 },
        timing: { duration: 0.6, delay: 0, ease },
      });
    }

    const now = new Date().toISOString();
    const plan: AnimationPlan = normalizePlan({
      id: uid("plan"),
      title: deriveTitle(req.prompt),
      description: req.prompt.trim() || "Generated animation plan.",
      style,
      trigger,
      framework,
      duration: 0, // recomputed
      ease,
      elements,
      timeline: [],
      responsive: { reducedMotion: "respect" },
      accessibility: { respectReducedMotion: true, focusManagement: "preserve" },
      performance: {
        gpuAccelerated: true,
        willChange: ["transform", "opacity"],
        notes: ["Uses transform + opacity only — GPU compositor path."],
      },
      createdAt: now,
      updatedAt: now,
    });

    const warnings: string[] = [];
    if (req.screenshots && req.screenshots.length > 0) {
      warnings.push(
        `Mock provider does not analyze images — ${req.screenshots.length} screenshot${req.screenshots.length === 1 ? "" : "s"} ignored. Configure AI_API_KEY for vision.`,
      );
    }

    return {
      plan,
      reasoning: "Deterministic keyword-driven plan (mock provider).",
      warnings: warnings.length ? warnings : undefined,
    };
  }

  /**
   * 3D-mode keyword short-circuit. Detects scene kind + motion verbs from the
   * prompt and returns a matching 3D preset with the description overwritten
   * so the user sees their own words back.
   */
  private async generate3DPlan(req: AIPlanRequest): Promise<AIPlanResponse> {
    const prompt = (req.prompt ?? "").toLowerCase();
    const requestedFramework: AnimationFramework =
      req.framework === "three-js" ? "three-js" : "react-three-fiber";

    let presetId = "preset_3d_cube_spin";
    if (/particle|dust|spark|point cloud/.test(prompt)) presetId = "preset_3d_particles_reveal";
    else if (/gallery|carousel|ring of|orbit|around/.test(prompt))
      presetId = "preset_3d_gallery_orbit";
    else if (/text|word|letter|type|title|heading/.test(prompt))
      presetId = "preset_3d_text_extrude";
    else if (/icosahedron|sphere|polyhedron|mesh|shape/.test(prompt))
      presetId = "preset_3d_mesh_pulse";
    else if (/fly|zoom|dolly|approach|towards? camera/.test(prompt))
      presetId = "preset_3d_cube_flyin";

    const preset = getPresetById(presetId);
    if (!preset) {
      throw new Error(`3D preset ${presetId} not found`);
    }
    const base = preset.build();
    const plan: AnimationPlan = normalizePlan({
      ...base,
      id: uid("plan"),
      title: deriveTitle(req.prompt) || base.title,
      description: req.prompt.trim() || base.description,
      framework: requestedFramework,
    });

    const warnings: string[] = [];
    if (req.screenshots && req.screenshots.length > 0) {
      warnings.push(
        `Mock provider does not analyze images — ${req.screenshots.length} screenshot${req.screenshots.length === 1 ? "" : "s"} ignored. Configure AI_API_KEY for vision.`,
      );
    }
    return {
      plan,
      reasoning: `Matched 3D preset "${presetId}" from prompt keywords.`,
      warnings: warnings.length ? warnings : undefined,
    };
  }
}
