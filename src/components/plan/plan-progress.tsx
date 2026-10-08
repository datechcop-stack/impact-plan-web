import { cn } from "@/lib/utils";
import type { PlanStatus } from "@/lib/plan";

type Step = {
  key: string;
  label: string;
  detail: string;
};

const STEPS: Step[] = [
  { key: "created", label: "Plan created", detail: "" },
  { key: "locked", label: "Locked · in progress", detail: "" },
  { key: "review", label: "Review window", detail: "" },
  { key: "self", label: "Self-assessment", detail: "You" },
  { key: "pm", label: "PM scoring", detail: "Each tagged manager" },
  { key: "lm", label: "Line manager review", detail: "" },
  { key: "final", label: "Finalized", detail: "Archived" },
];

function activeIndex(status: PlanStatus, pmDone?: number, pmTotal?: number): number {
  switch (status) {
    case "DRAFT":
      return 0;
    case "LOCKED":
      if (pmTotal && pmDone !== undefined && pmDone < pmTotal) return 4;
      return 1;
    case "PARTLY_UNLOCKED":
    case "UNLOCKED":
      return 1;
    case "REVIEW_OPEN":
      return 3;
    case "IN_REVIEW":
      if (pmTotal && pmDone !== undefined && pmDone < pmTotal) return 4;
      return 5;
    case "FINALIZED":
      return 6;
    default:
      return 1;
  }
}

type PlanProgressProps = {
  status: PlanStatus;
  createdAt?: string;
  reviewOpens?: string | null;
  lineManagerName?: string | null;
  pmDone?: number;
  pmTotal?: number;
  className?: string;
};

export function PlanProgress({
  status,
  createdAt,
  reviewOpens,
  lineManagerName,
  pmDone,
  pmTotal,
  className,
}: PlanProgressProps) {
  const current = activeIndex(status, pmDone, pmTotal);
  const steps = STEPS.map((step, index) => {
    let detail = step.detail;
    if (index === 0 && createdAt) {
      detail = new Date(createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
    }
    if (index === 1 && current === 1) detail = "You are here";
    if (index === 2 && reviewOpens) {
      detail = `Opens ${new Date(reviewOpens).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
    }
    if (index === 4 && pmTotal) detail = `${pmDone ?? 0} of ${pmTotal}`;
    if (index === 5 && lineManagerName) detail = lineManagerName;
    return { ...step, detail };
  });

  return (
    <ol className={cn("grid gap-2 sm:grid-cols-7", className)}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="min-w-0">
            <div
              className={cn(
                "h-1.5 rounded-full",
                done && "bg-success",
                active && "bg-accent",
                !done && !active && "bg-border",
              )}
            />
            <p
              className={cn(
                "mt-2 text-xs font-semibold",
                active ? "text-navy" : done ? "text-success" : "text-muted",
              )}
            >
              {step.label}
              {index === 4 && pmTotal ? ` · ${pmDone ?? 0} of ${pmTotal}` : ""}
            </p>
            {step.detail ? <p className="text-[11px] text-muted">{step.detail}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
