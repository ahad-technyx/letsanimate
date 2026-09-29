import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bike,
  Car,
  Cloud,
  Coffee,
  Compass,
  Cpu,
  Diamond,
  Flame,
  Heart,
  Leaf,
  Moon,
  Package,
  Plane,
  Rocket,
  Ship,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Truck,
  Zap,
} from "lucide-react";

/**
 * Curated allowlist of lucide icons the preview can render as an animation subject.
 * Adding an entry here + a keyword in KEYWORD_TO_ICON makes it detectable by the
 * mock AI provider.
 */
export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  car: Car,
  truck: Truck,
  bike: Bike,
  plane: Plane,
  ship: Ship,
  rocket: Rocket,
  phone: Smartphone,
  package: Package,
  bag: ShoppingBag,
  star: Star,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  flame: Flame,
  leaf: Leaf,
  diamond: Diamond,
  bolt: Zap,
  sparkles: Sparkles,
  arrow: ArrowRight,
  cpu: Cpu,
  coffee: Coffee,
  compass: Compass,
};

export type SubjectIconName = keyof typeof SUBJECT_ICONS;

/**
 * Prompt keywords → subject icon name.
 * Regex is applied case-insensitively with word boundaries.
 */
export const KEYWORD_TO_ICON: Array<{ pattern: RegExp; name: SubjectIconName }> = [
  { pattern: /\b(cars?|automobiles?|vehicles?|sedan|coupe)\b/i, name: "car" },
  { pattern: /\btrucks?\b/i, name: "truck" },
  { pattern: /\b(bikes?|bicycles?|cycles?)\b/i, name: "bike" },
  { pattern: /\b(planes?|airplanes?|jets?|aircraft)\b/i, name: "plane" },
  { pattern: /\b(ships?|boats?|yachts?)\b/i, name: "ship" },
  { pattern: /\brockets?\b/i, name: "rocket" },
  { pattern: /\b(phones?|mobiles?|smartphones?)\b/i, name: "phone" },
  { pattern: /\b(packages?|boxes?)\b/i, name: "package" },
  { pattern: /\b(bags?|shopping)\b/i, name: "bag" },
  { pattern: /\bstars?\b/i, name: "star" },
  { pattern: /\bhearts?\b/i, name: "heart" },
  { pattern: /\b(suns?|sunshine|sunrise|sunset)\b/i, name: "sun" },
  { pattern: /\b(moons?|lunar)\b/i, name: "moon" },
  { pattern: /\bclouds?\b/i, name: "cloud" },
  { pattern: /\b(flames?|fires?)\b/i, name: "flame" },
  { pattern: /\b(leaf|leaves|plants?)\b/i, name: "leaf" },
  { pattern: /\b(diamonds?|gems?|crystals?)\b/i, name: "diamond" },
  { pattern: /\b(bolts?|lightning|zap|thunder)\b/i, name: "bolt" },
  { pattern: /\b(sparkles?|magic|shine|glitter)\b/i, name: "sparkles" },
  { pattern: /\barrows?\b/i, name: "arrow" },
  { pattern: /\b(cpu|chip|processor)\b/i, name: "cpu" },
  { pattern: /\bcoffee\b/i, name: "coffee" },
  { pattern: /\b(compass|direction)\b/i, name: "compass" },
];

/**
 * Emoji hint — if a user's prompt contains an emoji, use it as the subject.
 * Uses the Unicode property escape which is broader and simpler than surrogate ranges.
 */
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

export interface DetectedSubject {
  kind: "icon" | "emoji";
  value: string;
  label?: string;
}

export function detectSubject(prompt: string): DetectedSubject | undefined {
  const emojiMatch = prompt.match(EMOJI_REGEX);
  if (emojiMatch) {
    return { kind: "emoji", value: emojiMatch[0] };
  }
  for (const { pattern, name } of KEYWORD_TO_ICON) {
    const m = prompt.match(pattern);
    if (m) return { kind: "icon", value: name, label: m[0].toLowerCase() };
  }
  return undefined;
}
