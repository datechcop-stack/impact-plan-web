"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EntryAccordionProps = {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function EntryAccordion({
  title,
  subtitle,
  expanded,
  onToggle,
  onRemove,
  removeLabel = "Remove entry",
  trailing,
  children,
  className,
}: EntryAccordionProps) {
  return (
    <div
      className={cn("rounded-xl border border-border", expanded && "border-accent/40", className)}
    >
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <span
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold text-muted",
              expanded && "border-accent bg-accent-soft text-navy",
            )}
            aria-hidden
          >
            {expanded ? "−" : "+"}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-navy">{title}</span>
            {subtitle ? (
              <span className="block truncate text-xs text-muted">{subtitle}</span>
            ) : null}
          </span>
        </button>
        {trailing}
        {onRemove ? (
          <Button type="button" variant="link" className="shrink-0 text-xs" onClick={onRemove}>
            {removeLabel}
          </Button>
        ) : null}
      </div>
      {expanded ? <div className="border-t border-border p-4 pt-3">{children}</div> : null}
    </div>
  );
}

export function entryAccordionKey(type: string, index: number, id?: string): string {
  return id ?? `${type}-${index}`;
}
