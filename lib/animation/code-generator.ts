import type {
  Animation3DProperties,
  Animation3DScene,
  AnimationElement,
  AnimationMode,
  AnimationPlan,
  AnimationProperties,
  Easing,
  ScrollTriggerConfig,
} from "@/types/animation";

// ─────────────────────────────────────────────────────────────────────────────
// Public API

export type CodeTarget =
  | "gsap"
  | "gsap-scrolltrigger"
  | "react"
  | "nextjs"
  | "css"
  | "three-js"
  | "react-three-fiber";

export const TARGET_LABELS: Record<CodeTarget, string> = {
  gsap: "GSAP",
  "gsap-scrolltrigger": "GSAP + ScrollTrigger",
  react: "React",
  nextjs: "Next.js",
  css: "CSS",
  "three-js": "Three.js (vanilla)",
  "react-three-fiber": "React Three Fiber",
};

export const TARGET_EXTENSION: Record<CodeTarget, string> = {
  gsap: "js",
  "gsap-scrolltrigger": "js",
  react: "tsx",
  nextjs: "tsx",
  css: "css",
  "three-js": "js",
  "react-three-fiber": "tsx",
};

export const TARGET_LANGUAGE: Record<CodeTarget, "js" | "css"> = {
  gsap: "js",
  "gsap-scrolltrigger": "js",
  react: "js",
  nextjs: "js",
  css: "css",
  "three-js": "js",
  "react-three-fiber": "js",
};

/** Which targets are valid for a plan of the given mode. */
export function targetsForMode(mode: AnimationMode): CodeTarget[] {
  return mode === "3d"
    ? ["three-js", "react-three-fiber"]
    : ["gsap", "gsap-scrolltrigger", "react", "nextjs", "css"];
}

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
    case "three-js":
      return generateThreeJs(plan);
    case "react-three-fiber":
      return generateReactThreeFiber(plan);
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

// ─────────────────────────────────────────────────────────────────────────────
// Three.js — shared helpers

function selectorToMeshName(selector: string): string {
  const s = selector.trim();
  return s.startsWith(".") || s.startsWith("#") ? s.slice(1) : s;
}

interface ThreeSceneEmit {
  /** JS/TS lines that declare + add the meshes to the scene. */
  meshLines: string[];
  /** Name of the primary mesh variable (used as tween fallback). */
  primaryVar: string;
  /** Map from mesh name → variable name + optional material var. */
  meshByName: Record<string, { obj: string; material?: string }>;
}

/**
 * Emit vanilla-Three.js JS that builds the meshes for a given scene kind.
 * Every mesh gets a `.name` mirroring what the runtime preview engine uses
 * so element selectors round-trip cleanly.
 */
function emitThreeMeshes(kind: NonNullable<Animation3DScene["kind"]> = "cube"): ThreeSceneEmit {
  switch (kind) {
    case "mesh": {
      return {
        meshLines: [
          `const meshGeo = new THREE.IcosahedronGeometry(1, 1);`,
          `const meshMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.5, roughness: 0.25, transparent: true });`,
          `const mesh = new THREE.Mesh(meshGeo, meshMat);`,
          `mesh.name = "mesh";`,
          `scene.add(mesh);`,
        ],
        primaryVar: "mesh",
        meshByName: { mesh: { obj: "mesh", material: "meshMat" } },
      };
    }
    case "particles": {
      return {
        meshLines: [
          `const particlesGroup = new THREE.Group();`,
          `particlesGroup.name = "particles";`,
          `{`,
          `  const positions = new Float32Array(800 * 3);`,
          `  for (let i = 0; i < 800; i++) {`,
          `    positions[i * 3 + 0] = (Math.random() - 0.5) * 6;`,
          `    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;`,
          `    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;`,
          `  }`,
          `  const geo = new THREE.BufferGeometry();`,
          `  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));`,
          `  const mat = new THREE.PointsMaterial({ color: 0x8b5cf6, size: 0.04, transparent: true, opacity: 0.9 });`,
          `  const points = new THREE.Points(geo, mat);`,
          `  points.name = "points";`,
          `  particlesGroup.add(points);`,
          `}`,
          `scene.add(particlesGroup);`,
        ],
        primaryVar: "particlesGroup",
        meshByName: { particles: { obj: "particlesGroup" } },
      };
    }
    case "text": {
      return {
        meshLines: [
          `const textGeo = new THREE.BoxGeometry(2.4, 0.6, 0.35);`,
          `const textMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.3, roughness: 0.35, transparent: true });`,
          `const text = new THREE.Mesh(textGeo, textMat);`,
          `text.name = "text";`,
          `scene.add(text);`,
        ],
        primaryVar: "text",
        meshByName: { text: { obj: "text", material: "textMat" } },
      };
    }
    case "gallery3d": {
      return {
        meshLines: [
          `const gallery = new THREE.Group();`,
          `gallery.name = "gallery";`,
          `const galleryColors = [0x8b5cf6, 0x06b6d4, 0xf59e0b, 0xef4444, 0x10b981];`,
          `galleryColors.forEach((c, i) => {`,
          `  const geo = new THREE.PlaneGeometry(1.2, 1.6);`,
          `  const mat = new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, transparent: true });`,
          `  const card = new THREE.Mesh(geo, mat);`,
          `  card.name = "card-" + i;`,
          `  const angle = (i / galleryColors.length) * Math.PI * 2;`,
          `  card.position.set(Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2);`,
          `  card.lookAt(0, 0, 0);`,
          `  gallery.add(card);`,
          `});`,
          `scene.add(gallery);`,
        ],
        primaryVar: "gallery",
        meshByName: { gallery: { obj: "gallery" } },
      };
    }
    case "cube":
    default: {
      return {
        meshLines: [
          `const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);`,
          `const cubeMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.4, roughness: 0.3, transparent: true });`,
          `const cube = new THREE.Mesh(cubeGeo, cubeMat);`,
          `cube.name = "cube";`,
          `scene.add(cube);`,
        ],
        primaryVar: "cube",
        meshByName: { cube: { obj: "cube", material: "cubeMat" } },
      };
    }
  }
}

interface ParsedProps3D {
  position: Partial<{ x: number; y: number; z: number }>;
  rotation: Partial<{ x: number; y: number; z: number }>;
  scale: Partial<{ x: number; y: number; z: number }>;
  material: Partial<{ opacity: number; color: string; wireframe: boolean }>;
}

const DEG2RAD_STR = "Math.PI / 180";

function parse3DProps(props: Animation3DProperties | undefined): ParsedProps3D {
  const out: ParsedProps3D = { position: {}, rotation: {}, scale: {}, material: {} };
  if (!props) return out;
  if (props.positionX !== undefined) out.position.x = round(props.positionX);
  if (props.positionY !== undefined) out.position.y = round(props.positionY);
  if (props.positionZ !== undefined) out.position.z = round(props.positionZ);
  if (props.rotationX !== undefined) out.rotation.x = round(props.rotationX);
  if (props.rotationY !== undefined) out.rotation.y = round(props.rotationY);
  if (props.rotationZ !== undefined) out.rotation.z = round(props.rotationZ);
  if (props.scale !== undefined) {
    out.scale.x = round(props.scale);
    out.scale.y = round(props.scale);
    out.scale.z = round(props.scale);
  }
  if (props.scaleX !== undefined) out.scale.x = round(props.scaleX);
  if (props.scaleY !== undefined) out.scale.y = round(props.scaleY);
  if (props.scaleZ !== undefined) out.scale.z = round(props.scaleZ);
  if (props.opacity !== undefined) out.material.opacity = round(props.opacity);
  if (props.color) out.material.color = props.color;
  if (props.wireframe !== undefined) out.material.wireframe = props.wireframe;
  return out;
}

function fmtVec3(vals: Partial<{ x: number; y: number; z: number }>, radians = false): string {
  const suffix = radians ? ` * (${DEG2RAD_STR})` : "";
  const parts: string[] = [];
  if (vals.x !== undefined) parts.push(`x: ${vals.x}${suffix}`);
  if (vals.y !== undefined) parts.push(`y: ${vals.y}${suffix}`);
  if (vals.z !== undefined) parts.push(`z: ${vals.z}${suffix}`);
  return `{ ${parts.join(", ")} }`;
}

/**
 * Emit `tl.fromTo(...)` lines for a plan element targeting the mesh named
 * `objVar` (with optional `matVar` for material). One tween per animated
 * category (position / rotation / scale / material).
 */
function emit3DElementTweens(
  el: AnimationElement,
  objVar: string,
  matVar: string | undefined,
  defaultEase: Easing,
  tlName: string,
  indent: number,
): string[] {
  const from = parse3DProps(el.from as Animation3DProperties | undefined);
  const to = parse3DProps(el.to as Animation3DProperties | undefined);
  const pos = round(el.timing.delay ?? 0);
  const duration = round(el.timing.duration);
  const ease = el.timing.ease ?? defaultEase;

  const commonExtras: string[] = [`duration: ${duration}`, `ease: ${fmtValue(ease)}`];
  if (el.timing.repeat !== undefined) commonExtras.push(`repeat: ${el.timing.repeat}`);
  if (el.timing.yoyo !== undefined) commonExtras.push(`yoyo: ${el.timing.yoyo}`);
  const extras = commonExtras.join(", ");

  const lines: string[] = [];
  const emitTween = (label: string, target: string, fromObj: string, toObj: string) => {
    lines.push(ind(indent, `// ${label}`));
    lines.push(ind(indent, `${tlName}.fromTo(${target}, ${fromObj}, { ...${toObj}, ${extras} }, ${pos});`));
  };

  const posFrom = fmtVec3(from.position);
  const posTo = fmtVec3(to.position);
  if (posFrom !== "{  }" || posTo !== "{  }") {
    emitTween(`${el.label ?? el.id} · position`, `${objVar}.position`, posFrom, posTo);
  }

  const rotFrom = fmtVec3(from.rotation, /* radians */ true);
  const rotTo = fmtVec3(to.rotation, /* radians */ true);
  if (rotFrom !== "{  }" || rotTo !== "{  }") {
    emitTween(`${el.label ?? el.id} · rotation`, `${objVar}.rotation`, rotFrom, rotTo);
  }

  const scaleFrom = fmtVec3(from.scale);
  const scaleTo = fmtVec3(to.scale);
  if (scaleFrom !== "{  }" || scaleTo !== "{  }") {
    emitTween(`${el.label ?? el.id} · scale`, `${objVar}.scale`, scaleFrom, scaleTo);
  }

  if (matVar) {
    const matFromParts: string[] = [];
    const matToParts: string[] = [];
    if (from.material.opacity !== undefined) matFromParts.push(`opacity: ${from.material.opacity}`);
    if (to.material.opacity !== undefined) matToParts.push(`opacity: ${to.material.opacity}`);
    if (from.material.wireframe !== undefined)
      matFromParts.push(`wireframe: ${from.material.wireframe}`);
    if (to.material.wireframe !== undefined) matToParts.push(`wireframe: ${to.material.wireframe}`);
    if (matFromParts.length || matToParts.length) {
      emitTween(
        `${el.label ?? el.id} · material`,
        matVar,
        `{ ${matFromParts.join(", ")} }`,
        `{ ${matToParts.join(", ")} }`,
      );
    }
    if (from.material.color || to.material.color) {
      const fromC = from.material.color ?? "#ffffff";
      const toC = to.material.color ?? "#ffffff";
      lines.push(
        ind(
          indent,
          `// ${el.label ?? el.id} · color (tweened via a color proxy since THREE.Color needs .set())`,
        ),
      );
      lines.push(
        ind(
          indent,
          `{ const c = { t: 0 }, from = new THREE.Color(${fmtValue(fromC)}), to = new THREE.Color(${fmtValue(toC)}); ${tlName}.to(c, { t: 1, duration: ${duration}, ease: ${fmtValue(ease)}, onUpdate: () => ${matVar}.color.lerpColors(from, to, c.t) }, ${pos}); }`,
        ),
      );
    }
  }

  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// Three.js (vanilla)

function generateThreeJs(plan: AnimationPlan): string {
  const kind = plan.scene3d?.kind ?? "cube";
  const emit = emitThreeMeshes(kind);
  const camPos = {
    x: plan.scene3d?.camera?.positionX ?? 0,
    y: plan.scene3d?.camera?.positionY ?? 0.6,
    z: plan.scene3d?.camera?.positionZ ?? 5,
  };
  const fov = plan.scene3d?.camera?.fov ?? 50;
  const bg = plan.scene3d?.background ?? "#0b0b12";
  const ambient = plan.scene3d?.ambientIntensity ?? 0.6;
  const dir = plan.scene3d?.directionalIntensity ?? 1.1;

  const out: string[] = [];
  out.push(...toBanner(plan));
  out.push("");
  out.push(`// Mount inside an element with id="animation-root" (or edit the selector below).`);
  out.push(`// npm install three gsap`);
  out.push("");
  out.push(`import * as THREE from "three";`);
  out.push(`import gsap from "gsap";`);
  out.push("");
  out.push(`const container = document.querySelector("#animation-root");`);
  out.push(`if (!container) throw new Error("No #animation-root container found");`);
  out.push("");
  out.push(`const scene = new THREE.Scene();`);
  out.push(`scene.background = new THREE.Color(${fmtValue(bg)});`);
  out.push("");
  out.push(
    `const camera = new THREE.PerspectiveCamera(${fov}, container.clientWidth / container.clientHeight, 0.1, 100);`,
  );
  out.push(`camera.position.set(${camPos.x}, ${camPos.y}, ${camPos.z});`);
  out.push(`camera.lookAt(0, 0, 0);`);
  out.push("");
  out.push(`const renderer = new THREE.WebGLRenderer({ antialias: true });`);
  out.push(`renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));`);
  out.push(`renderer.setSize(container.clientWidth, container.clientHeight);`);
  out.push(`container.appendChild(renderer.domElement);`);
  out.push("");
  out.push(`scene.add(new THREE.AmbientLight(0xffffff, ${ambient}));`);
  out.push(`const dirLight = new THREE.DirectionalLight(0xffffff, ${dir});`);
  out.push(`dirLight.position.set(3, 4, 5);`);
  out.push(`scene.add(dirLight);`);
  out.push("");
  out.push(`// Scene: ${kind}`);
  out.push(...emit.meshLines);
  out.push("");
  out.push(`const tl = gsap.timeline({ defaults: { ease: ${fmtValue(plan.ease)} } });`);
  out.push("");
  for (const el of plan.elements) {
    const name = selectorToMeshName(el.selector);
    const meshInfo = emit.meshByName[name];
    const objVar = meshInfo?.obj ?? emit.primaryVar;
    const matVar = meshInfo?.material;
    const lines = emit3DElementTweens(el, objVar, matVar, plan.ease, "tl", 0);
    out.push(...lines);
    out.push("");
  }
  out.push(`// Render loop`);
  out.push(`function tick() {`);
  out.push(ind(1, `renderer.render(scene, camera);`));
  out.push(ind(1, `requestAnimationFrame(tick);`));
  out.push(`}`);
  out.push(`tick();`);
  out.push("");
  out.push(`window.addEventListener("resize", () => {`);
  out.push(ind(1, `camera.aspect = container.clientWidth / container.clientHeight;`));
  out.push(ind(1, `camera.updateProjectionMatrix();`));
  out.push(ind(1, `renderer.setSize(container.clientWidth, container.clientHeight);`));
  out.push(`});`);
  return out.join("\n") + "\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// React Three Fiber

interface R3FMeshEmit {
  /** JSX for the meshes, each already using its ref binding. */
  jsx: string[];
  /** Ref declarations for the component body. */
  refLines: string[];
  /** Timeline setup lines for the useEffect body. */
  tweenSetupLines: string[];
  /** Map from mesh name → { objRef, materialRef? }. */
  meshByName: Record<string, { obj: string; material?: string }>;
  primaryVar: string;
}

function emitR3FMeshes(kind: NonNullable<Animation3DScene["kind"]> = "cube"): R3FMeshEmit {
  switch (kind) {
    case "mesh":
      return {
        refLines: [
          `const meshRef = useRef<THREE.Mesh>(null!);`,
          `const meshMatRef = useRef<THREE.MeshStandardMaterial>(null!);`,
        ],
        jsx: [
          `<mesh ref={meshRef} name="mesh">`,
          `  <icosahedronGeometry args={[1, 1]} />`,
          `  <meshStandardMaterial ref={meshMatRef} color="#7c3aed" metalness={0.5} roughness={0.25} transparent />`,
          `</mesh>`,
        ],
        tweenSetupLines: [
          `const mesh = meshRef.current;`,
          `const meshMat = meshMatRef.current;`,
        ],
        meshByName: { mesh: { obj: "mesh", material: "meshMat" } },
        primaryVar: "mesh",
      };
    case "particles":
      return {
        refLines: [`const particlesRef = useRef<THREE.Group>(null!);`],
        jsx: [
          `<group ref={particlesRef} name="particles">`,
          `  <points>`,
          `    <bufferGeometry>`,
          `      <bufferAttribute attach="attributes-position" count={particlePositions.length / 3} array={particlePositions} itemSize={3} args={[particlePositions, 3]} />`,
          `    </bufferGeometry>`,
          `    <pointsMaterial color="#8b5cf6" size={0.04} transparent opacity={0.9} />`,
          `  </points>`,
          `</group>`,
        ],
        tweenSetupLines: [`const particlesGroup = particlesRef.current;`],
        meshByName: { particles: { obj: "particlesGroup" } },
        primaryVar: "particlesGroup",
      };
    case "text":
      return {
        refLines: [
          `const textRef = useRef<THREE.Mesh>(null!);`,
          `const textMatRef = useRef<THREE.MeshStandardMaterial>(null!);`,
        ],
        jsx: [
          `<mesh ref={textRef} name="text">`,
          `  <boxGeometry args={[2.4, 0.6, 0.35]} />`,
          `  <meshStandardMaterial ref={textMatRef} color="#f5f5f5" metalness={0.3} roughness={0.35} transparent />`,
          `</mesh>`,
        ],
        tweenSetupLines: [`const text = textRef.current;`, `const textMat = textMatRef.current;`],
        meshByName: { text: { obj: "text", material: "textMat" } },
        primaryVar: "text",
      };
    case "gallery3d":
      return {
        refLines: [`const galleryRef = useRef<THREE.Group>(null!);`],
        jsx: [
          `<group ref={galleryRef} name="gallery">`,
          `  {["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"].map((c, i, arr) => {`,
          `    const angle = (i / arr.length) * Math.PI * 2;`,
          `    return (`,
          `      <mesh`,
          `        key={i}`,
          `        name={"card-" + i}`,
          `        position={[Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2]}`,
          `        rotation={[0, -angle + Math.PI / 2, 0]}`,
          `      >`,
          `        <planeGeometry args={[1.2, 1.6]} />`,
          `        <meshStandardMaterial color={c} side={THREE.DoubleSide} transparent />`,
          `      </mesh>`,
          `    );`,
          `  })}`,
          `</group>`,
        ],
        tweenSetupLines: [`const gallery = galleryRef.current;`],
        meshByName: { gallery: { obj: "gallery" } },
        primaryVar: "gallery",
      };
    case "cube":
    default:
      return {
        refLines: [
          `const cubeRef = useRef<THREE.Mesh>(null!);`,
          `const cubeMatRef = useRef<THREE.MeshStandardMaterial>(null!);`,
        ],
        jsx: [
          `<mesh ref={cubeRef} name="cube">`,
          `  <boxGeometry args={[1.5, 1.5, 1.5]} />`,
          `  <meshStandardMaterial ref={cubeMatRef} color="#8b5cf6" metalness={0.4} roughness={0.3} transparent />`,
          `</mesh>`,
        ],
        tweenSetupLines: [`const cube = cubeRef.current;`, `const cubeMat = cubeMatRef.current;`],
        meshByName: { cube: { obj: "cube", material: "cubeMat" } },
        primaryVar: "cube",
      };
  }
}

function generateReactThreeFiber(plan: AnimationPlan): string {
  const kind = plan.scene3d?.kind ?? "cube";
  const emit = emitR3FMeshes(kind);
  const camPos = {
    x: plan.scene3d?.camera?.positionX ?? 0,
    y: plan.scene3d?.camera?.positionY ?? 0.6,
    z: plan.scene3d?.camera?.positionZ ?? 5,
  };
  const fov = plan.scene3d?.camera?.fov ?? 50;
  const ambient = plan.scene3d?.ambientIntensity ?? 0.6;
  const dir = plan.scene3d?.directionalIntensity ?? 1.1;
  const bg = plan.scene3d?.background ?? "#0b0b12";
  const componentBase = componentName(plan);
  const sceneName = componentBase.replace(/Component$/, "") + "Scene";

  const out: string[] = [];
  out.push(`"use client";`, "");
  out.push(...toBanner(plan));
  out.push("");
  out.push(`// npm install three @react-three/fiber gsap`);
  out.push("");
  out.push(`import { useEffect, useRef${kind === "particles" ? ", useMemo" : ""} } from "react";`);
  out.push(`import { Canvas } from "@react-three/fiber";`);
  out.push(`import * as THREE from "three";`);
  out.push(`import gsap from "gsap";`);
  out.push("");
  out.push(`function ${sceneName}() {`);
  if (kind === "particles") {
    out.push(
      ind(
        1,
        `const particlePositions = useMemo(() => {`,
      ),
    );
    out.push(ind(2, `const arr = new Float32Array(800 * 3);`));
    out.push(ind(2, `for (let i = 0; i < 800; i++) {`));
    out.push(ind(3, `arr[i * 3 + 0] = (Math.random() - 0.5) * 6;`));
    out.push(ind(3, `arr[i * 3 + 1] = (Math.random() - 0.5) * 6;`));
    out.push(ind(3, `arr[i * 3 + 2] = (Math.random() - 0.5) * 6;`));
    out.push(ind(2, `}`));
    out.push(ind(2, `return arr;`));
    out.push(ind(1, `}, []);`));
    out.push("");
  }
  emit.refLines.forEach((l) => out.push(ind(1, l)));
  out.push("");
  out.push(ind(1, `useEffect(() => {`));
  emit.tweenSetupLines.forEach((l) => out.push(ind(2, l)));
  out.push(ind(2, `if (${emit.tweenSetupLines.map((l) => l.match(/const (\w+)/)?.[1]).filter(Boolean).map((n) => `!${n}`).join(" || ")}) return;`));
  out.push(
    ind(2, `const tl = gsap.timeline({ defaults: { ease: ${fmtValue(plan.ease)} } });`),
  );
  for (const el of plan.elements) {
    const name = selectorToMeshName(el.selector);
    const meshInfo = emit.meshByName[name];
    const objVar = meshInfo?.obj ?? emit.primaryVar;
    const matVar = meshInfo?.material;
    const lines = emit3DElementTweens(el, objVar, matVar, plan.ease, "tl", 2);
    out.push(...lines);
  }
  out.push(ind(2, `return () => tl.kill();`));
  out.push(ind(1, `}, []);`));
  out.push("");
  out.push(ind(1, `return (`));
  out.push(ind(2, `<>`));
  emit.jsx.forEach((l) => out.push(ind(3, l)));
  out.push(ind(2, `</>`));
  out.push(ind(1, `);`));
  out.push(`}`);
  out.push("");
  out.push(`export function ${componentBase}() {`);
  out.push(
    ind(
      1,
      `return (`,
    ),
  );
  out.push(
    ind(
      2,
      `<Canvas camera={{ position: [${camPos.x}, ${camPos.y}, ${camPos.z}], fov: ${fov} }} style={{ background: ${fmtValue(bg)} }}>`,
    ),
  );
  out.push(ind(3, `<ambientLight intensity={${ambient}} />`));
  out.push(ind(3, `<directionalLight position={[3, 4, 5]} intensity={${dir}} />`));
  out.push(ind(3, `<${sceneName} />`));
  out.push(ind(2, `</Canvas>`));
  out.push(ind(1, `);`));
  out.push(`}`);
  return out.join("\n") + "\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS

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
