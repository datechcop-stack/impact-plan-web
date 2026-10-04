"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type CycleResponse = {
  cycle: {
    windowOpens: string;
    selfAssessmentDeadline: string;
    pmScoringDeadline: string;
    finalizeDeadline: string;
    audience: "ALL_WITH_PLAN" | "SELECTED";
    remindOnOpen: boolean;
    remindBeforeDeadlines: boolean;
    weeklyLmSummary: boolean;
    status: string;
  } | null;
  plansWithPlan: number;
};

const year = 2026;

export function ReviewCycleClient() {
  const queryClient = useQueryClient();
  const cycleQuery = useQuery({
    queryKey: ["review-cycle", year],
    queryFn: () => apiFetch<CycleResponse>(`/admin/review-cycles/${year}`),
  });

  const [form, setForm] = useState({
    windowOpens: "2026-12-01",
    selfAssessmentDeadline: "2026-12-15",
    pmScoringDeadline: "2026-12-22",
    finalizeDeadline: "2026-12-31",
    audience: "ALL_WITH_PLAN" as "ALL_WITH_PLAN" | "SELECTED",
    remindOnOpen: true,
    remindBeforeDeadlines: true,
    weeklyLmSummary: false,
  });

  useEffect(() => {
    if (cycleQuery.data?.cycle) {
      const cycle = cycleQuery.data.cycle;
      setForm({
        windowOpens: cycle.windowOpens.slice(0, 10),
        selfAssessmentDeadline: cycle.selfAssessmentDeadline.slice(0, 10),
        pmScoringDeadline: cycle.pmScoringDeadline.slice(0, 10),
        finalizeDeadline: cycle.finalizeDeadline.slice(0, 10),
        audience: cycle.audience,
        remindOnOpen: cycle.remindOnOpen,
        remindBeforeDeadlines: cycle.remindBeforeDeadlines,
        weeklyLmSummary: cycle.weeklyLmSummary,
      });
    }
  }, [cycleQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => apiFetch(`/admin/review-cycles/${year}`, { method: "PUT", json: form }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["review-cycle"] }),
  });

  const openMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/review-cycles/${year}/open-now`, { method: "POST", json: {} }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["review-cycle"] }),
  });

  return (
    <AdminShell active="review-cycle">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent">ADMIN</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Review cycle · {year}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            When the review window opens, plans become open for self-assessment and staff are
            notified.
          </p>
        </div>
        <Badge variant="accent">
          {cycleQuery.data?.cycle?.status === "OPEN" ? "Open" : "Scheduled"}
        </Badge>
      </div>

      {cycleQuery.isLoading ? (
        <div className="mt-8 space-y-6" role="status" aria-label="Loading review cycle">
          <PageHeaderSkeleton />
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5">
              <Skeleton className="h-5 w-28" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm shadow-navy/5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-4 h-24 w-full" />
            </div>
          </div>
        </div>
      ) : cycleQuery.isError ? (
        <StateView className="mt-8" state="error" />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <Card className="space-y-6">
            <div>
              <CardTitle>Key dates</CardTitle>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["windowOpens", "Review window opens"],
                    ["selfAssessmentDeadline", "Self-assessment deadline"],
                    ["pmScoringDeadline", "PM scoring deadline"],
                    ["finalizeDeadline", "Line manager finalize deadline"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="date"
                      value={form[key]}
                      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <CardTitle>Who it applies to</CardTitle>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    [
                      "ALL_WITH_PLAN",
                      `All staff with a plan (${cycleQuery.data?.plansWithPlan ?? 0})`,
                    ],
                    ["SELECTED", "Selected people only"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "rounded-xl border p-4 text-left text-sm font-semibold",
                      form.audience === value ? "border-accent bg-accent-soft" : "border-border",
                    )}
                    onClick={() => setForm({ ...form, audience: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <CardTitle>Email reminders</CardTitle>
              <div className="mt-3 space-y-2 text-sm">
                {(
                  [
                    ["remindOnOpen", "When the window opens"],
                    ["remindBeforeDeadlines", "3 days before each deadline"],
                    ["weeklyLmSummary", "Weekly summary to line managers"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => openMutation.mutate()}
                disabled={openMutation.isPending}
              >
                Open window now
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                Save schedule
              </Button>
            </div>
          </Card>
          <Card>
            <CardTitle>Year-end chain</CardTitle>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted">
              <li>Window opens. Plans move from Locked to Review open.</li>
              <li>Staff self-assess every entry and submit.</li>
              <li>Tagged PMs score each entry 0–100% with a comment.</li>
              <li>Line managers add one overall comment and finalize.</li>
              <li>Plans archived for {year}. Start the next cycle from Impact plans.</li>
            </ol>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
