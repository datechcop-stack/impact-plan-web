import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("skeleton-shimmer rounded-xl bg-border/70", className)}
      {...props}
    />
  );
}

export function PageHeaderSkeleton({
  withAction = false,
  className,
}: {
  withAction?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {withAction ? <Skeleton className="h-11 w-36" /> : null}
    </div>
  );
}

export function StatCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-9 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-white p-4 shadow-sm shadow-navy/5",
        className,
      )}
    >
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={`h-${index}`} className="h-3 w-20" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid items-center gap-3 border-t border-border/70 pt-3"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, col) => (
              <Skeleton key={col} className={cn("h-4", col === 0 ? "w-32" : "w-20")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="mt-8 space-y-6" role="status" aria-label="Loading dashboard">
      <StatCardsSkeleton count={5} className="xl:grid-cols-5" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5">
          <Skeleton className="h-5 w-36" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListPageSkeleton({
  stats = 4,
  rows = 5,
  className,
}: {
  stats?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("mt-8 space-y-6", className)} role="status" aria-label="Loading">
      {stats > 0 ? <StatCardsSkeleton count={stats} /> : null}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-12 w-64 max-w-full" />
        <Skeleton className="h-12 w-36" />
        <Skeleton className="h-12 w-36" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanPageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading your plan">
      <PageHeaderSkeleton withAction />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 max-w-md" />
                <Skeleton className="h-4 w-2/3 max-w-sm" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-4 h-20 w-full" />
          </div>
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TwoColumnFormSkeleton() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]" role="status" aria-label="Loading">
      <TableSkeleton rows={6} columns={4} />
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
