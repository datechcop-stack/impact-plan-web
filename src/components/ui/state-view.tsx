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
};

export function StateView({ state, title, description, className, action }: StateViewProps) {
  if (state === "loading") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-white p-6 shadow-sm shadow-navy/5",
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
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center shadow-sm shadow-navy/5",
        className,
      )}
      role={state === "error" ? "alert" : "status"}
    >
      <p className="text-base font-semibold text-navy">{title ?? states[state]}</p>
      {description ? <p className="mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
