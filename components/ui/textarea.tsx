import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "resize-y disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});
