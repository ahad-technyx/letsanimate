import { ImageIcon } from "lucide-react";
import type { AnimationPlan } from "@/types/animation";

export function GalleryPreview({ plan }: { plan: AnimationPlan }) {
  const title = plan.title || "Gallery";
  return (
    <section className="section p-8">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{plan.style}</p>
      <h2 className="mt-1 mb-6 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="gallery grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="gallery-item flex aspect-square items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground"
          >
            <ImageIcon className="h-6 w-6" />
          </div>
        ))}
      </div>
    </section>
  );
}
