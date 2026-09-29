import * as React from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2",
          "whitespace-nowrap rounded-md border border-border bg-card px-2 py-1",
          "text-xs text-foreground shadow-md opacity-0 group-hover:opacity-100",
          "transition-opacity",
        )}
      >
        {content}
      </span>
    </span>
  );
}
