import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Fixed-height multiline field — avoid growing with content. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "h-24 w-full resize-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-[border-color,box-shadow] placeholder:text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:bg-background",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
