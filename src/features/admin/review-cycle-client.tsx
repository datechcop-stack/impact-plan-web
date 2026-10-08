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
import { useToast } from "@/components/ui/toast";
import { UserPicker } from "@/components/ui/user-picker";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type CycleResponse = {
  cycle: {
    windowOpens: string;
    selfAssessmentDeadline: string;
    pmScoringDeadline: string;
    finalizeDeadline: string;
    audience: "ALL_WITH_PLAN" | "SELECTED";
    purpose: "MIDYEAR_PLAN_UPDATE" | "YEAR_END_REVIEW";
    remindOnOpen: boolean;
    remindBeforeDeadlines: boolean;
    weeklyLmSummary: boolean;
    status: string;
    participants?: Array<{ userId: string; user: { id: string; fullName: string } }>;
  } | null;
  plansWithPlan: number;
};

const year = 2026;

export function ReviewCycleClient() {
  const queryClient = useQueryClient();
  const toast = useToast();
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
    purpose: "YEAR_END_REVIEW" as "MIDYEAR_PLAN_UPDATE" | "YEAR_END_REVIEW",
    remindOnOpen: true,
    remindBeforeDeadlines: true,
    weeklyLmSummary: false,
    participantIds: [] as string[],
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
        purpose: cycle.purpose ?? "YEAR_END_REVIEW",
        remindOnOpen: cycle.remindOnOpen,
        remindBeforeDeadlines: cycle.remindBeforeDeadlines,
        weeklyLmSummary: cycle.weeklyLmSummary,
        participantIds: cycle.participants?.map((p) => p.userId) ?? [],
      });
    }
  }, [cycleQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => apiFetch(`/admin/review-cycles/${year}`, { method: "PUT", json: form }),
    onSuccess: async () => {
      toast.success("Review schedule saved", "Key dates and audience settings were updated.");
      await queryClient.invalidateQueries({ queryKey: ["review-cycle"] });
    },
    onError: (error) => {
      toast.error("Could not save schedule", error.message);
    },
  });

  const openMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ opened: number; purpose: string }>(`/admin/review-cycles/${year}/open-now`, {
        method: "POST",
        json: {},
      }),
    onSuccess: async (data) => {
      toast.success(
        "Review window opened",
        `${data.opened} plan(s) updated · ${data.purpose === "MIDYEAR_PLAN_UPDATE" ? "mid-year plan update" : "year-end self-assessment"}.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["review-cycle"] });
    },
    onError: (error) => {
      toast.error("Could not open window", error.message);
    },
  });

  const prepareMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ notified: number }>(`/admin/review-cycles/${year + 1}/prepare-new-year`, {
        method: "POST",
        json: {},
      }),
    onSuccess: async (data) => {
      toast.success(
        "New cycle started",
        `${data.notified} staff notified to prepare plans for ${year + 1}.`,
      );
    },
    onError: (error) => {
      toast.error("Could not start new cycle", error.message);
    },
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
            Open a mid-year window for plan updates, or the year-end window for self-assessment and
            scoring.
          </p>
        </div>
        <Badge variant="accent">
          {cycleQuery.data?.cycle?.status === "OPEN" ? "Open" : "Scheduled"}
        </Badge>
      </div>

      {cycleQuery.isLoading ? (
        <div className="mt-8 space-y-6" role="status" aria-label="Loading review cycle">
          <PageHeaderSkeleton />
        </div>
      ) : cycleQuery.isError ? (
        <StateView className="mt-8" state="error" />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <Card className="space-y-6">
            <div>
              <CardTitle>Window type</CardTitle>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["MIDYEAR_PLAN_UPDATE", "Mid-year · update impact plan"],
                    ["YEAR_END_REVIEW", "Year-end · self-assessment & scoring"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "rounded-xl border p-4 text-left text-sm font-semibold",
                      form.purpose === value ? "border-accent bg-accent-soft" : "border-border",
                    )}
                    onClick={() => setForm({ ...form, purpose: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <CardTitle>Key dates</CardTitle>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["windowOpens", "Review window opens"],
                    ["selfAssessmentDeadline", "Update / self-assessment deadline"],
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
              {form.audience === "SELECTED" ? (
                <div className="mt-4 space-y-3">
                  <UserPicker
                    value=""
                    placeholder="Add a person to this review window…"
                    onChange={(userId) => {
                      if (!userId || form.participantIds.includes(userId)) return;
                      setForm({ ...form, participantIds: [...form.participantIds, userId] });
                    }}
                  />
                  <ul className="space-y-2 text-sm">
                    {form.participantIds.map((id) => (
                      <li
                        key={id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <span>{id}</span>
                        <Button
                          variant="link"
                          onClick={() =>
                            setForm({
                              ...form,
                              participantIds: form.participantIds.filter((item) => item !== id),
                            })
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div>
              <CardTitle>Email reminders</CardTitle>
              <div className="mt-3 space-y-2 text-sm">
                {(
                  [
                    ["remindOnOpen", "When the window opens (names the exact window triggered)"],
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
                loading={openMutation.isPending}
                loadingText="Opening…"
              >
                Open window now
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                loading={saveMutation.isPending}
                loadingText="Saving…"
              >
                Save schedule
              </Button>
            </div>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardTitle>Year-end chain</CardTitle>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted">
                <li>Window opens. Mid-year unlocks plans; year-end opens self-assessment.</li>
                <li>Staff update the plan or complete self-assessment, then submit.</li>
                <li>Tagged PMs score each entry 0–100% with a comment.</li>
                <li>Line managers add one overall comment and finalize.</li>
                <li>Plans archived for {year}. Export from Impact plans for LT.</li>
              </ol>
            </Card>
            <Card>
              <CardTitle>New plan cycle</CardTitle>
              <p className="mt-2 text-sm text-muted">
                Notify all staff to prepare their Impact Plan for {year + 1}.
              </p>
              <Button
                className="mt-4"
                size="full"
                variant="secondary"
                disabled={prepareMutation.isPending}
                loading={prepareMutation.isPending}
                loadingText="Notifying…"
                onClick={() => prepareMutation.mutate()}
              >
                Start {year + 1} setup
              </Button>
            </Card>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
