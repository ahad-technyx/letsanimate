"use client";

import gsap from "gsap";
import * as THREE from "three";
import type {
  Animation3DProperties,
  AnimationElement,
  AnimationElementProperties,
  AnimationPlan,
} from "@/types/animation";
import type { PreviewHandle, PreviewOptions } from "./preview-engine";

const DEG2RAD = Math.PI / 180;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Strip a leading "." so ".cube" and "cube" both resolve to the mesh named "cube". */
function selectorToName(selector: string): string {
  const s = selector.trim();
  return s.startsWith(".") || s.startsWith("#") ? s.slice(1) : s;
}

function readColor(value: string | undefined, fallback: THREE.Color): THREE.Color {
  if (!value) return fallback;
  try {
    return new THREE.Color(value);
  } catch {
    return fallback;
  }
}

/**
 * Build the default scene contents for a given `kind`. Each mesh gets a
 * `.name` so plan elements can target it via `selector: "cube"` (or ".cube").
 */
function buildSceneContents(
  scene: THREE.Scene,
  kind: NonNullable<AnimationPlan["scene3d"]>["kind"] | undefined,
): { primary: THREE.Object3D; disposables: Array<{ dispose(): void }> } {
  const disposables: Array<{ dispose(): void }> = [];

  switch (kind) {
    case "particles": {
      const group = new THREE.Group();
      group.name = "particles";
      const count = 800;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 6;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0x8b5cf6,
        size: 0.04,
        transparent: true,
        opacity: 0.9,
      });
      const points = new THREE.Points(geo, mat);
      points.name = "points";
      group.add(points);
      scene.add(group);
      disposables.push(geo, mat);
      return { primary: group, disposables };
    }

    case "text": {
      // Extruded slab as a text stand-in — actual TextGeometry needs font loading.
      const geo = new THREE.BoxGeometry(2.4, 0.6, 0.35);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        metalness: 0.3,
        roughness: 0.35,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = "text";
      scene.add(mesh);
      disposables.push(geo, mat);
      return { primary: mesh, disposables };
    }

    case "mesh": {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        metalness: 0.5,
        roughness: 0.25,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = "mesh";
      scene.add(mesh);
      disposables.push(geo, mat);
      return { primary: mesh, disposables };
    }

    case "gallery3d": {
      const group = new THREE.Group();
      group.name = "gallery";
      const colors = [0x8b5cf6, 0x06b6d4, 0xf59e0b, 0xef4444, 0x10b981];
      const cards: THREE.Mesh[] = [];
      colors.forEach((c, i) => {
        const geo = new THREE.PlaneGeometry(1.2, 1.6);
        const mat = new THREE.MeshStandardMaterial({
          color: c,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1,
        });
        const card = new THREE.Mesh(geo, mat);
        card.name = `card-${i}`;
        const angle = (i / colors.length) * Math.PI * 2;
        card.position.set(Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2);
        card.lookAt(0, 0, 0);
        group.add(card);
        cards.push(card);
        disposables.push(geo, mat);
      });
      scene.add(group);
      return { primary: group, disposables };
    }

    case "cube":
    default: {
      const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        metalness: 0.4,
        roughness: 0.3,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = "cube";
      scene.add(mesh);
      disposables.push(geo, mat);
      return { primary: mesh, disposables };
    }
  }
}

interface AnimatedTargets {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  material: { opacity: number; color: THREE.Color; emissive: THREE.Color; wireframe: number };
}

function snapshotTargets(obj: THREE.Object3D): AnimatedTargets {
  const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
  return {
    position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
    rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
    scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
    material: {
      opacity: mat?.opacity ?? 1,
      color: (mat?.color?.clone() as THREE.Color) ?? new THREE.Color(0xffffff),
      emissive: (mat?.emissive?.clone() as THREE.Color) ?? new THREE.Color(0x000000),
      wireframe: mat?.wireframe ? 1 : 0,
    },
  };
}

function applyTargets(obj: THREE.Object3D, t: AnimatedTargets) {
  obj.position.set(t.position.x, t.position.y, t.position.z);
  obj.rotation.set(t.rotation.x, t.rotation.y, t.rotation.z);
  obj.scale.set(t.scale.x, t.scale.y, t.scale.z);
  const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
  if (mat) {
    mat.opacity = t.material.opacity;
    mat.transparent = t.material.opacity < 1;
    mat.color.copy(t.material.color);
    if (mat.emissive) mat.emissive.copy(t.material.emissive);
    mat.wireframe = t.material.wireframe > 0.5;
    mat.needsUpdate = true;
  }
}

/**
 * Merge a plan element's `from` (or `to`) property bag into a mutable
 * `AnimatedTargets` snapshot. Only Animation3DProperties keys are read.
 */
function mergeInto(target: AnimatedTargets, props: AnimationElementProperties | undefined) {
  if (!props) return;
  const p = props as Animation3DProperties;
  if (p.positionX !== undefined) target.position.x = p.positionX;
  if (p.positionY !== undefined) target.position.y = p.positionY;
  if (p.positionZ !== undefined) target.position.z = p.positionZ;
  if (p.rotationX !== undefined) target.rotation.x = p.rotationX * DEG2RAD;
  if (p.rotationY !== undefined) target.rotation.y = p.rotationY * DEG2RAD;
  if (p.rotationZ !== undefined) target.rotation.z = p.rotationZ * DEG2RAD;
  const uniform = p.scale;
  if (uniform !== undefined) {
    target.scale.x = uniform;
    target.scale.y = uniform;
    target.scale.z = uniform;
  }
  if (p.scaleX !== undefined) target.scale.x = p.scaleX;
  if (p.scaleY !== undefined) target.scale.y = p.scaleY;
  if (p.scaleZ !== undefined) target.scale.z = p.scaleZ;
  if (p.opacity !== undefined) target.material.opacity = p.opacity;
  if (p.color) target.material.color = new THREE.Color(p.color);
  if (p.emissive) target.material.emissive = new THREE.Color(p.emissive);
  if (p.wireframe !== undefined) target.material.wireframe = p.wireframe ? 1 : 0;
}

/**
 * Register a single `AnimationElement` with the shared timeline. Looks up
 * the target mesh by name, snapshots its current state, merges the element's
 * `from` and `to` bags, and adds a gsap tween that mutates position /
 * rotation / scale / material on every frame.
 */
function attachElementTween(
  timeline: gsap.core.Timeline,
  el: AnimationElement,
  scene: THREE.Scene,
  primary: THREE.Object3D,
  defaultEase: string,
) {
  const name = selectorToName(el.selector);
  const found = scene.getObjectByName(name);
  const target = found ?? primary;
  const current = snapshotTargets(target);
  const fromState: AnimatedTargets = JSON.parse(JSON.stringify(current));
  // Restore color instances (JSON.parse lost THREE.Color prototypes).
  fromState.material.color = current.material.color.clone();
  fromState.material.emissive = current.material.emissive.clone();
  mergeInto(fromState, el.from);

  const toState: AnimatedTargets = JSON.parse(JSON.stringify(fromState));
  toState.material.color = fromState.material.color.clone();
  toState.material.emissive = fromState.material.emissive.clone();
  mergeInto(toState, el.to);

  // Proxy object gsap can tween; on every update we apply into the mesh.
  const proxy = {
    px: fromState.position.x,
    py: fromState.position.y,
    pz: fromState.position.z,
    rx: fromState.rotation.x,
    ry: fromState.rotation.y,
    rz: fromState.rotation.z,
    sx: fromState.scale.x,
    sy: fromState.scale.y,
    sz: fromState.scale.z,
    op: fromState.material.opacity,
    wf: fromState.material.wireframe,
    mix: 0,
  };

  const fromColor = fromState.material.color.clone();
  const toColor = toState.material.color.clone();
  const fromEmissive = fromState.material.emissive.clone();
  const toEmissive = toState.material.emissive.clone();
  const tmpColor = new THREE.Color();

  applyTargets(target, fromState);

  const position = el.timing.delay ?? 0;
  timeline.to(
    proxy,
    {
      px: toState.position.x,
      py: toState.position.y,
      pz: toState.position.z,
      rx: toState.rotation.x,
      ry: toState.rotation.y,
      rz: toState.rotation.z,
      sx: toState.scale.x,
      sy: toState.scale.y,
      sz: toState.scale.z,
      op: toState.material.opacity,
      wf: toState.material.wireframe,
      mix: 1,
      duration: el.timing.duration,
      ease: el.timing.ease ?? defaultEase,
      repeat: el.timing.repeat,
      yoyo: el.timing.yoyo,
      onUpdate: () => {
        target.position.set(proxy.px, proxy.py, proxy.pz);
        target.rotation.set(proxy.rx, proxy.ry, proxy.rz);
        target.scale.set(proxy.sx, proxy.sy, proxy.sz);
        const mat = (target as THREE.Mesh).material as
          | THREE.MeshStandardMaterial
          | THREE.PointsMaterial
          | undefined;
        if (mat) {
          mat.opacity = proxy.op;
          mat.transparent = proxy.op < 1;
          tmpColor.copy(fromColor).lerp(toColor, proxy.mix);
          if ("color" in mat) mat.color.copy(tmpColor);
          if ("emissive" in mat && mat.emissive) {
            tmpColor.copy(fromEmissive).lerp(toEmissive, proxy.mix);
            mat.emissive.copy(tmpColor);
          }
          if ("wireframe" in mat) mat.wireframe = proxy.wf > 0.5;
        }
      },
    },
    position,
  );
}

/**
 * Three.js implementation of the same `PreviewHandle` contract used by the
 * 2D GSAP engine. Draws into a canvas appended to `root`. GSAP drives the
 * timeline; a rAF loop calls renderer.render every frame.
 */
export function createPreview3D(
  root: HTMLElement,
  plan: AnimationPlan,
  opts: PreviewOptions = {},
): PreviewHandle {
  const respectReduced = opts.respectReducedMotion ?? plan.accessibility.respectReducedMotion;
  const reduced = respectReduced && prefersReducedMotion();

  const scene3d = plan.scene3d ?? {};
  const bgColor = readColor(scene3d.background, new THREE.Color(0x0b0b12));
  const ambientIntensity = scene3d.ambientIntensity ?? 0.6;
  const dirIntensity = scene3d.directionalIntensity ?? 1.1;

  const scene = new THREE.Scene();
  scene.background = bgColor;

  const width = Math.max(1, root.clientWidth);
  const height = Math.max(1, root.clientHeight);
  const camera = new THREE.PerspectiveCamera(
    scene3d.camera?.fov ?? 50,
    width / height,
    0.1,
    100,
  );
  const camStart = {
    x: scene3d.camera?.positionX ?? 0,
    y: scene3d.camera?.positionY ?? 0.6,
    z: scene3d.camera?.positionZ ?? 5,
  };
  camera.position.set(camStart.x, camStart.y, camStart.z);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, dirIntensity);
  dir.position.set(3, 4, 5);
  scene.add(dir);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  root.appendChild(renderer.domElement);

  const { primary, disposables } = buildSceneContents(scene, scene3d.kind);

  // Timeline. We use gsap.timeline() paused by default; play() starts it.
  const timeline = gsap.timeline({
    paused: !(opts.autoplay ?? true),
    defaults: { ease: plan.ease || "power2.out" },
  });

  if (reduced) {
    // Snap primary + every named target to the last "to" bag we can find.
    plan.elements.forEach((el) => {
      const name = selectorToName(el.selector);
      const target = scene.getObjectByName(name) ?? primary;
      const snap = snapshotTargets(target);
      mergeInto(snap, el.to);
      applyTargets(target, snap);
    });
  } else {
    plan.elements.forEach((el) => {
      attachElementTween(timeline, el, scene, primary, plan.ease || "power2.out");
    });

    // If no elements target the primary mesh, add a subtle idle spin so the
    // scene isn't dead-still. Skipped when the plan already animates it.
    const primaryTargeted = plan.elements.some(
      (el) => selectorToName(el.selector) === primary.name,
    );
    if (!primaryTargeted && plan.elements.length === 0) {
      const idle = { r: 0 };
      timeline.to(idle, {
        r: Math.PI * 2,
        duration: 6,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          primary.rotation.y = idle.r;
          primary.rotation.x = idle.r * 0.4;
        },
      });
    }

    if (opts.loop ?? false) {
      timeline.repeat(-1);
      timeline.repeatDelay(opts.loopDelay ?? 1);
    }
  }

  // rAF loop.
  let raf = 0;
  let destroyed = false;
  const tick = () => {
    if (destroyed) return;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Resize.
  const resize = () => {
    const w = Math.max(1, root.clientWidth);
    const h = Math.max(1, root.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  ro?.observe(root);

  return {
    play() {
      timeline.play();
    },
    pause() {
      timeline.pause();
    },
    replay() {
      timeline.restart(true);
    },
    reset() {
      timeline.progress(0);
      timeline.pause(0);
    },
    setSpeed(rate: number) {
      timeline.timeScale(rate);
    },
    setLoop(loop: boolean, delay = 1) {
      timeline.repeat(loop ? -1 : 0);
      timeline.repeatDelay(delay);
    },
    isScrollDriven() {
      return false;
    },
    getTime() {
      return timeline.time();
    },
    getDuration() {
      return timeline.duration();
    },
    isActive() {
      return timeline.isActive();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      timeline.kill();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === root) {
        root.removeChild(renderer.domElement);
      }
    },
  };
}
