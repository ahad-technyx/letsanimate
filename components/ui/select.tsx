import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
