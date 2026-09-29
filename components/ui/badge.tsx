import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-accent text-accent-foreground",
  outline: "border border-border text-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
