import type {
  AnimationElement,
  AnimationPlan,
  AnimationProperties,
  Easing,
  ScrollTriggerConfig,
} from "@/types/animation";

// ─────────────────────────────────────────────────────────────────────────────
// Public API

export type CodeTarget = "gsap" | "gsap-scrolltrigger" | "react" | "nextjs" | "css";

export const TARGET_LABELS: Record<CodeTarget, string> = {
  gsap: "GSAP",
  "gsap-scrolltrigger": "GSAP + ScrollTrigger",
  react: "React",
  nextjs: "Next.js",
  css: "CSS",
};

export const TARGET_EXTENSION: Record<CodeTarget, string> = {
  gsap: "js",
  "gsap-scrolltrigger": "js",
  react: "tsx",
  nextjs: "tsx",
  css: "css",
};

export const TARGET_LANGUAGE: Record<CodeTarget, "js" | "css"> = {
  gsap: "js",
  "gsap-scrolltrigger": "js",
  react: "js",
  nextjs: "js",
  css: "css",
};

export function generateCode(plan: AnimationPlan, target: CodeTarget): string {
  switch (target) {
    case "gsap":
      return generateGsap(plan);
    case "gsap-scrolltrigger":
      return generateGsapScrollTrigger(plan);
    case "react":
      return generateReact(plan, /* nextjs */ false);
    case "nextjs":
      return generateReact(plan, /* nextjs */ true);
    case "css":
      return generateCss(plan);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting primitives

const INDENT = "  ";

function ind(level: number, s: string): string {
  return INDENT.repeat(level) + s;
}

function fmtValue(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") return String(round(v));
  if (typeof v === "boolean") return String(v);
  if (v === null || v === undefined) return String(v);
  return JSON.stringify(v);
}

function fmtObject(obj: Record<string, unknown>, indent: number): string {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "{}";
  const inner = entries.map(([k, v]) => ind(indent + 1, `${k}: ${fmtValue(v)},`)).join("\n");
  return `{\n${inner}\n${ind(indent, "}")}`;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function toBanner(plan: AnimationPlan, style: "js" | "css" = "js"): string[] {
  const prefix = style === "css" ? "/* " : "// ";
  const suffix = style === "css" ? " */" : "";
  return [
    `${prefix}${plan.title}${suffix}`,
    plan.description ? `${prefix}${plan.description}${suffix}` : null,
    `${prefix}Style: ${plan.style} · Trigger: ${plan.trigger.type} · Framework: ${plan.framework}${suffix}`,
  ].filter((x): x is string => !!x);
}

function propsForFromTo(el: AnimationElement, defaultEase: Easing): {
  from: Record<string, unknown>;
  to: Record<string, unknown>;
} {
  const from: Record<string, unknown> = { ...(el.from ?? {}) };
  const to: Record<string, unknown> = { ...(el.to ?? {}) };
  to.duration = round(el.timing.duration);
  if (el.timing.stagger !== undefined) to.stagger = round(el.timing.stagger);
  if (el.timing.repeat !== undefined) to.repeat = el.timing.repeat;
  if (el.timing.yoyo !== undefined) to.yoyo = el.timing.yoyo;
  to.ease = el.timing.ease ?? defaultEase;
  return { from, to };
}

function scrollTriggerObject(cfg: ScrollTriggerConfig | undefined, indent: number): string {
  const c = cfg ?? { trigger: ".section", start: "top 80%", end: "bottom 20%", scrub: 1 };
  const obj: Record<string, unknown> = { trigger: c.trigger };
  if (c.start !== undefined) obj.start = c.start;
  if (c.end !== undefined) obj.end = c.end;
  if (c.scrub !== undefined) obj.scrub = c.scrub;
  if (c.pin !== undefined) obj.pin = c.pin;
  if (c.markers !== undefined) obj.markers = c.markers;
  if (c.toggleActions !== undefined) obj.toggleActions = c.toggleActions;
  return fmtObject(obj, indent);
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline body — shared between GSAP-only and React targets

function timelineBody(plan: AnimationPlan, baseIndent: number, tlName = "tl"): string {
  const lines: string[] = [];
  for (const el of plan.elements) {
    const { from, to } = propsForFromTo(el, plan.ease);
    const pos = round(el.timing.delay ?? 0);
    lines.push(ind(baseIndent, `${tlName}.fromTo(`));
    lines.push(ind(baseIndent + 1, `${fmtValue(el.selector)},`));
    lines.push(ind(baseIndent + 1, `${fmtObject(from, baseIndent + 1)},`));
    lines.push(ind(baseIndent + 1, `${fmtObject(to, baseIndent + 1)},`));
    lines.push(ind(baseIndent + 1, `${fmtValue(pos)},`));
    lines.push(ind(baseIndent, `);`));
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// GSAP (plain)

function generateGsap(plan: AnimationPlan): string {
  const out: string[] = [];
  out.push(...toBanner(plan));
  out.push("");
  out.push(`import gsap from "gsap";`);
  out.push("");
  out.push(
    `const tl = gsap.timeline({ defaults: { ease: ${fmtValue(plan.ease)} } });`,
  );
  out.push("");
  out.push(timelineBody(plan, 0));
  return out.join("\n") + "\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// GSAP + ScrollTrigger

function generateGsapScrollTrigger(plan: AnimationPlan): string {
  const cfg =
    plan.trigger.type === "onScroll" ? plan.trigger.scrollTrigger : undefined;
  const out: string[] = [];
  out.push(...toBanner(plan));
  out.push("");
  out.push(`import gsap from "gsap";`);
  out.push(`import { ScrollTrigger } from "gsap/ScrollTrigger";`);
  out.push("");
  out.push(`gsap.registerPlugin(ScrollTrigger);`);
  out.push("");
  out.push(`const tl = gsap.timeline({`);
  out.push(ind(1, `defaults: { ease: ${fmtValue(plan.ease)} },`));
  out.push(ind(1, `scrollTrigger: ${scrollTriggerObject(cfg, 1)},`));
  out.push(`});`);
  out.push("");
  out.push(timelineBody(plan, 0));
  return out.join("\n") + "\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// React / Next.js

function componentName(plan: AnimationPlan): string {
  const raw = plan.title
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return (raw || "Animation") + "Component";
}

function generateReact(plan: AnimationPlan, nextjs: boolean): string {
  const isScroll = plan.trigger.type === "onScroll" || plan.trigger.type === "onInView";
  const cfg = plan.trigger.type === "onScroll" ? plan.trigger.scrollTrigger : undefined;
  const name = componentName(plan);
  const out: string[] = [];
  if (nextjs) out.push(`"use client";`, "");
  out.push(...toBanner(plan));
  out.push("");
  out.push(`import { useEffect, useRef } from "react";`);
  out.push(`import gsap from "gsap";`);
  if (isScroll) out.push(`import { ScrollTrigger } from "gsap/ScrollTrigger";`);
  out.push("");
  if (isScroll) out.push(`gsap.registerPlugin(ScrollTrigger);`, "");
  out.push(`export function ${name}() {`);
  out.push(ind(1, `const rootRef = useRef<HTMLDivElement>(null);`));
  out.push("");
  out.push(ind(1, `useEffect(() => {`));
  out.push(ind(2, `if (!rootRef.current) return;`));
  out.push(ind(2, `const ctx = gsap.context(() => {`));
  if (isScroll) {
    out.push(ind(3, `const tl = gsap.timeline({`));
    out.push(ind(4, `defaults: { ease: ${fmtValue(plan.ease)} },`));
    if (plan.trigger.type === "onScroll") {
      out.push(ind(4, `scrollTrigger: ${scrollTriggerObject(cfg, 4)},`));
    } else if (plan.trigger.type === "onInView") {
      const sel = plan.trigger.selector;
      out.push(
        ind(
          4,
          `scrollTrigger: { trigger: ${fmtValue(sel)}, start: "top 85%", toggleActions: "play none none reverse" },`,
        ),
      );
    }
    out.push(ind(3, `});`));
  } else {
    out.push(
      ind(3, `const tl = gsap.timeline({ defaults: { ease: ${fmtValue(plan.ease)} } });`),
    );
  }
  // timeline body
  out.push(timelineBody(plan, 3));
  out.push(ind(2, `}, rootRef);`));
  out.push(ind(2, `return () => ctx.revert();`));
  out.push(ind(1, `}, []);`));
  out.push("");
  out.push(ind(1, `return <div ref={rootRef}>{/* your markup */}</div>;`));
  out.push(`}`);
  return out.join("\n") + "\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS

const EASE_TO_CSS: Record<string, string> = {
  linear: "linear",
  none: "linear",
  "power1.in": "cubic-bezier(0.11, 0, 0.5, 0)",
  "power1.out": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "power1.inOut": "cubic-bezier(0.45, 0, 0.55, 1)",
  "power2.in": "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
  "power2.out": "cubic-bezier(0.33, 1, 0.68, 1)",
  "power2.inOut": "cubic-bezier(0.65, 0, 0.35, 1)",
  "power3.in": "cubic-bezier(0.32, 0, 0.67, 0)",
  "power3.out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "power3.inOut": "cubic-bezier(0.87, 0, 0.13, 1)",
  "expo.in": "cubic-bezier(0.7, 0, 0.84, 0)",
  "expo.out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "expo.inOut": "cubic-bezier(0.87, 0, 0.13, 1)",
  "back.in": "cubic-bezier(0.36, 0, 0.66, -0.56)",
  "back.out": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "back.inOut": "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  "elastic.out": "cubic-bezier(0.16, 1, 0.3, 1)",
};

function cssEase(ease: string | undefined, fallback: string): string {
  if (!ease) return EASE_TO_CSS[fallback] ?? "ease-out";
  return EASE_TO_CSS[ease] ?? EASE_TO_CSS[fallback] ?? "ease-out";
}

function propsToTransform(props: AnimationProperties): string | null {
  const parts: string[] = [];
  if (props.x !== undefined)
    parts.push(`translateX(${typeof props.x === "number" ? `${props.x}px` : props.x})`);
  if (props.y !== undefined)
    parts.push(`translateY(${typeof props.y === "number" ? `${props.y}px` : props.y})`);
  if (props.scale !== undefined) parts.push(`scale(${props.scale})`);
  if (props.rotation !== undefined) parts.push(`rotate(${props.rotation}deg)`);
  if (props.skewX !== undefined) parts.push(`skewX(${props.skewX}deg)`);
  if (props.skewY !== undefined) parts.push(`skewY(${props.skewY}deg)`);
  return parts.length ? parts.join(" ") : null;
}

function keyframeBlock(prefix: string, from: AnimationProperties, to: AnimationProperties): string {
  const lines: string[] = [];
  lines.push(`@keyframes ${prefix} {`);
  lines.push(ind(1, `from {`));
  const fromT = propsToTransform(from);
  if (fromT) lines.push(ind(2, `transform: ${fromT};`));
  if (from.opacity !== undefined) lines.push(ind(2, `opacity: ${from.opacity};`));
  lines.push(ind(1, `}`));
  lines.push(ind(1, `to {`));
  const toT = propsToTransform(to);
  if (toT) lines.push(ind(2, `transform: ${toT};`));
  if (to.opacity !== undefined) lines.push(ind(2, `opacity: ${to.opacity};`));
  lines.push(ind(1, `}`));
  lines.push(`}`);
  return lines.join("\n");
}

function slug(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function generateCss(plan: AnimationPlan): string {
  const out: string[] = [];
  out.push(...toBanner(plan, "css"));
  if (plan.trigger.type === "onScroll" || plan.trigger.type === "onInView") {
    out.push(
      `/* Note: scroll-linked animations require GSAP ScrollTrigger or the CSS Scroll-Driven Animations spec. */`,
    );
  }
  out.push("");

  const ruleBlocks: string[] = [];
  const keyframeBlocks: string[] = [];

  plan.elements.forEach((el, i) => {
    const from = el.from ?? {};
    const to = el.to ?? {};
    const name = `mp-${slug(el.label ?? el.id)}-${i}`;
    const duration = `${round(el.timing.duration)}s`;
    const ease = cssEase(el.timing.ease, plan.ease);
    const baseDelay = round(el.timing.delay ?? 0);
    const stagger = el.timing.stagger;

    keyframeBlocks.push(keyframeBlock(name, from, to));

    if (stagger !== undefined) {
      // 6 children by convention; author can extend.
      const CHILDREN = 6;
      for (let n = 1; n <= CHILDREN; n++) {
        const delay = round(baseDelay + (n - 1) * stagger);
        ruleBlocks.push(
          [
            `${el.selector}:nth-child(${n}) {`,
            ind(1, `animation: ${name} ${duration} ${ease} ${delay}s both;`),
            `}`,
          ].join("\n"),
        );
      }
    } else {
      ruleBlocks.push(
        [
          `${el.selector} {`,
          ind(1, `animation: ${name} ${duration} ${ease} ${baseDelay}s both;`),
          `}`,
        ].join("\n"),
      );
    }
  });

  // Reduced-motion guardrail
  ruleBlocks.push(
    [
      `@media (prefers-reduced-motion: reduce) {`,
      ...plan.elements.map((el) => ind(1, `${el.selector} { animation: none; }`)),
      `}`,
    ].join("\n"),
  );

  out.push(ruleBlocks.join("\n\n"));
  out.push("");
  out.push(keyframeBlocks.join("\n\n"));
  return out.join("\n") + "\n";
}
