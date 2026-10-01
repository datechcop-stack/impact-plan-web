import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center",
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
