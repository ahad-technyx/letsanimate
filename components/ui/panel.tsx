import * as React from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("flex h-full flex-col overflow-hidden bg-card", className)}
      {...props}
    />
  );
}

export function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn(
        "flex h-10 shrink-0 items-center justify-between border-b border-border px-3",
        "text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-auto p-3", className)} {...props} />;
}
