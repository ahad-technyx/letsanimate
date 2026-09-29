"use client";

import type { Screenshot } from "./types";

export const MAX_SCREENSHOTS = 4;
export const MAX_SIZE_BYTES = 6 * 1024 * 1024; // total across a project
const RESIZE_MAX_EDGE = 1200;
const JPEG_QUALITY = 0.82;

function uid(prefix = "shot"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * Resize an image to fit within RESIZE_MAX_EDGE px on its longest side and
 * re-encode as JPEG so localStorage doesn't fill up on 4K screenshots.
 * PNGs with transparency lose alpha — acceptable for design references.
 */
export async function fileToScreenshot(file: File): Promise<Screenshot> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }

  const bitmap = await createImageBitmap(file);
  const { width: srcW, height: srcH } = bitmap;
  const scale = Math.min(1, RESIZE_MAX_EDGE / Math.max(srcW, srcH));
  const dstW = Math.round(srcW * scale);
  const dstH = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas is unavailable in this browser.");
  }
  ctx.drawImage(bitmap, 0, 0, dstW, dstH);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return {
    id: uid(),
    name: file.name,
    dataUrl,
    width: dstW,
    height: dstH,
    size: dataUrl.length,
    addedAt: new Date().toISOString(),
  };
}

export function totalScreenshotBytes(shots: Screenshot[] | undefined): number {
  if (!shots) return 0;
  return shots.reduce((sum, s) => sum + s.size, 0);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
