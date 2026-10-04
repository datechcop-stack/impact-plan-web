import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const states = {
  loading: "Loading…",
  empty: "Nothing here yet.",
  error: "Something went wrong.",
} as const;

type StateViewProps = {
  state: keyof typeof states;
  title?: string;
  description?: string;
  className?: string;
  action?: ReactNode;
  /** Use inside cards/lists where a full hero empty state is too large. */
  size?: "default" | "compact";
};

export function StateView({
  state,
  title,
  description,
  className,
  action,
  size = "default",
}: StateViewProps) {
  if (state === "loading") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-white p-6 shadow-sm shadow-navy/5",
          size === "compact" && "rounded-xl p-4 shadow-none",
          className,
        )}
        role="status"
        aria-label={title ?? states.loading}
      >
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-5/6 max-w-md" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white text-center shadow-sm shadow-navy/5",
        size === "compact" ? "rounded-xl px-4 py-6 shadow-none" : "px-6 py-12",
        className,
      )}
      role={state === "error" ? "alert" : "status"}
    >
      <p className={cn("font-semibold text-navy", size === "compact" ? "text-sm" : "text-base")}>
        {title ?? states[state]}
      </p>
      {description ? (
        <p className={cn("mt-2 max-w-md text-muted", size === "compact" ? "text-xs" : "text-sm")}>
          {description}
        </p>
      ) : null}
      {action ? <div className={cn(size === "compact" ? "mt-3" : "mt-4")}>{action}</div> : null}
    </div>
  );
}
