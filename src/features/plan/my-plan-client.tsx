"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PlanProgress } from "@/components/plan/plan-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { Textarea } from "@/components/ui/textarea";
import { UserPicker } from "@/components/ui/user-picker";
import { EditRequestModal } from "@/features/plan/edit-request-modal";
import { EntryObjectivesEditor } from "@/features/plan/entry-objectives-editor";
import { EntryObjectivesView } from "@/features/plan/entry-objectives-view";
import {
  emptyObjectives,
  toObjectiveDrafts,
  type ObjectiveDraft,
} from "@/features/plan/objectives";
import type { MyPlanResponse, PlanEntry } from "@/features/plan/types";
import { apiFetch } from "@/lib/api/client";
import {
  COMPONENT_META,
  roundDisplay,
  statusBadgeVariant,
  statusLabel,
  type ComponentType,
} from "@/lib/plan";
import { cn } from "@/lib/utils";

const RESULT_LABEL = {
  ACHIEVED: "Achieved",
  PARTLY: "Partly achieved",
  NOT: "Not achieved",
} as const;

export function MyPlanClient() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<"ACHIEVED" | "PARTLY" | "NOT" | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftEvidence, setDraftEvidence] = useState("");
  const [editingEntries, setEditingEntries] = useState<
    Array<{
      id?: string;
      componentType: ComponentType;
      title: string;
      objectives: ObjectiveDraft[];
      managerId: string;
      dueDate: string;
    }>
  >([]);
  const [removedEntryIds, setRemovedEntryIds] = useState<string[]>([]);

  const [planYear, setPlanYear] = useState(2026);

  const yearsQuery = useQuery({
    queryKey: ["my-plan-years"],
    queryFn: () => apiFetch<{ plans: Array<{ year: number; status: string }> }>("/me/plans/years"),
  });

  const planQuery = useQuery({
    queryKey: ["my-plan", planYear],
    queryFn: () => apiFetch<MyPlanResponse>(`/me/plan?year=${planYear}`),
  });

  const saveAssessment = useMutation({
    mutationFn: (entryId: string) =>
      apiFetch(`/me/plan/entries/${entryId}/self-assessment`, {
        method: "PUT",
        json: {
          result: draftResult,
          resultText: draftText,
          evidenceUrl: draftEvidence || undefined,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-plan"] });
      setActiveEntryId(null);
    },
  });

  const submitPlan = useMutation({
    mutationFn: () => apiFetch("/me/plan/submit", { method: "POST", json: {} }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["my-plan"] }),
  });

  const saveAndNotify = useMutation({
    mutationFn: () =>
      apiFetch("/me/plan/save-and-notify", {
        method: "POST",
        json: { entries: editingEntries, removedEntryIds },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-plan"] });
      setRemovedEntryIds([]);
    },
  });

  const plan = planQuery.data?.plan;
  const allEntries = useMemo(
    () => plan?.components.filter((c) => c.enabled).flatMap((c) => c.entries) ?? [],
    [plan],
  );
  const assessedCount = allEntries.filter((e) => e.selfAssessment).length;
  const pmDone = allEntries.filter((e) => {
    if (!e.pmReview || e.pmReview.status !== "REVIEWED") return false;
    if (plan?.status === "LOCKED") return true;
    return e.pmReview.score != null;
  }).length;

  function startAssessment(entry: PlanEntry) {
    setActiveEntryId(entry.id);
    setDraftResult(entry.selfAssessment?.result ?? null);
    setDraftText(entry.selfAssessment?.resultText ?? "");
    setDraftEvidence(entry.selfAssessment?.evidenceUrl ?? "");
  }

  const isEditing =
    planQuery.data?.plan?.status === "PARTLY_UNLOCKED" ||
    planQuery.data?.plan?.status === "UNLOCKED";

  useEffect(() => {
    const current = planQuery.data?.plan;
    if (!current) return;
    if (current.status !== "PARTLY_UNLOCKED" && current.status !== "UNLOCKED") return;
    if (editingEntries.length > 0) return;
    const unlocked = current.components.filter(
      (c) => c.enabled && (current.status === "UNLOCKED" || c.lockState === "UNLOCKED"),
    );
    setEditingEntries(
      unlocked.flatMap((component) =>
        component.entries.map((entry) => ({
          id: entry.id,
          componentType: component.type,
          title: entry.title,
          objectives: toObjectiveDrafts(entry.objectives),
          managerId: entry.manager.id,
          dueDate: entry.dueDate.slice(0, 10),
        })),
      ),
    );
  }, [planQuery.data?.plan, editingEntries.length]);

  if (planQuery.isLoading) {
    return (
      <AppShell active="plan">
        <PlanPageSkeleton />
      </AppShell>
    );
  }

  if (planQuery.isError) {
    return (
      <AppShell active="plan">
        <StateView
          state="error"
          title="Could not load your plan"
          description={(planQuery.error as Error | null)?.message ?? "Sign in and try again."}
        />
      </AppShell>
    );
  }

  if (!plan) {
    return (
      <AppShell active="plan">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent">MY PLAN</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          My Impact Plan 2026
        </h1>
        <StateView
          className="mt-8 max-w-xl"
          state="empty"
          title="No plan yet"
          description="Create your Impact Plan to set goals across Projects, Business Development, Personal Development, and Communities of Practice."
          action={
            <Link
              href="/app/plan/new"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-navy px-6 text-sm font-semibold text-white shadow-sm shadow-navy/20 transition-all hover:bg-navy-soft"
            >
              Create my Impact Plan
            </Link>
          }
        />
      </AppShell>
    );
  }

  const isSelfAssessment =
    plan.status === "REVIEW_OPEN" && planQuery.data?.reviewCycle?.purpose !== "MIDYEAR_PLAN_UPDATE";
  const isInReview = plan.status === "IN_REVIEW" || plan.status === "FINALIZED";
  const isViewOnlyArchive = plan.status === "FINALIZED" || plan.year < 2026;
  const midyearUpdateOpen =
    plan.status === "UNLOCKED" &&
    plan.changeLogs.some((log) => log.action.includes("MIDYEAR_REVIEW_OPENED"));
  const isGoalReview = plan.status === "LOCKED";
  const showPmTracker =
    isInReview || (isGoalReview && allEntries.length > 0 && pmDone < allEntries.length);
  const isDraft = plan.status === "DRAFT";

  return (
    <AppShell active="plan" userName={plan.owner.fullName}>
      {isDraft ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent-soft px-4 py-3 text-sm text-navy">
          <span>
            This plan is still a draft. You can edit it freely until you lock it for the year.
          </span>
          <Link
            href="/app/plan/edit"
            className="inline-flex h-9 items-center rounded-lg bg-navy px-4 text-xs font-semibold text-white hover:bg-navy-soft"
          >
            Edit draft
          </Link>
        </div>
      ) : null}
      {midyearUpdateOpen ? (
        <div className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-navy">
          The mid-year review window is open. Update your plan entries below, then save and notify
          your administrator when you are finished.
        </div>
      ) : null}
      {isEditing ? (
        <div className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-navy">
          A component is unlocked for editing. Save changes & notify admin when you are done. You
          cannot remove existing entries — only add or update them.
        </div>
      ) : null}
      {isViewOnlyArchive ? (
        <div className="mb-4 rounded-lg bg-muted/10 px-4 py-3 text-sm text-muted">
          This plan is archived for {plan.year}. You can view it here but cannot make changes.
        </div>
      ) : null}
      {isGoalReview && pmDone < allEntries.length ? (
        <div className="mb-4 rounded-lg bg-warning-soft px-4 py-3 text-sm text-navy">
          Your plan is locked. Each tagged manager must review your goals ({pmDone} of{" "}
          {allEntries.length} reviewed) before the plan is fully set for the year.
        </div>
      ) : null}
      {isSelfAssessment ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
          <span>
            The year-end review window is open. Add your result for every entry, then submit.
          </span>
          {planQuery.data?.reviewCycle ? (
            <span>
              Closes{" "}
              {new Date(planQuery.data.reviewCycle.selfAssessmentDeadline).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent">MY PLAN</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {isSelfAssessment ? `Self-assessment ${plan.year}` : `My Impact Plan ${plan.year}`}
            </h1>
            <Badge variant={statusBadgeVariant(plan.status)}>{statusLabel(plan.status)}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {plan.owner.fullName}
            {plan.owner.jobTitle ? ` · ${plan.owner.jobTitle}` : ""}
            {plan.owner.lineManager ? ` · Line manager: ${plan.owner.lineManager.fullName}` : ""}
          </p>
          {(yearsQuery.data?.plans.length ?? 0) > 1 ? (
            <div className="mt-3">
              <Label htmlFor="plan-year">Plan year</Label>
              <select
                id="plan-year"
                className="mt-1 h-10 rounded-lg border border-border px-3 text-sm"
                value={planYear}
                onChange={(event) => setPlanYear(Number(event.target.value))}
              >
                {yearsQuery.data?.plans.map((item) => (
                  <option key={item.year} value={item.year}>
                    {item.year}
                    {item.status === "FINALIZED" ? " · archived" : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        {isDraft ? (
          <Link
            href="/app/plan/edit"
            className="inline-flex h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-white shadow-sm hover:bg-navy-soft"
          >
            Edit draft
          </Link>
        ) : null}
        {plan.status === "LOCKED" ? (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Request edit access
          </Button>
        ) : null}
      </div>

      {!isSelfAssessment ? (
        <PlanProgress
          className="mt-6"
          status={plan.status}
          createdAt={plan.createdAt}
          reviewOpens={planQuery.data?.reviewCycle?.windowOpens}
          lineManagerName={plan.owner.lineManager?.fullName}
          pmDone={pmDone}
          pmTotal={allEntries.length}
        />
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {showPmTracker ? (
            <Card>
              <CardTitle>{isGoalReview ? "Manager goal review" : "Review tracker"}</CardTitle>
              <p className="mt-1 text-sm text-muted">
                {isGoalReview
                  ? "Tagged managers review each entry's objectives after you lock the plan."
                  : plan.submittedAt
                    ? `Submitted ${new Date(plan.submittedAt).toLocaleDateString()}. Your plan is read-only while managers review it.`
                    : "Your plan is read-only while managers review it."}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-muted">
                    <tr>
                      <th className="py-2">Entry</th>
                      <th>Manager</th>
                      <th>Status</th>
                      <th>PM score</th>
                      <th>PM comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEntries.map((entry) => {
                      const component = plan.components.find((c) =>
                        c.entries.some((e) => e.id === entry.id),
                      );
                      const reviewed =
                        entry.pmReview?.status === "REVIEWED" &&
                        (isGoalReview || entry.pmReview.score != null);
                      return (
                        <tr key={entry.id} className="border-t border-border align-top">
                          <td className="py-3">
                            <p className="font-semibold text-navy">{entry.title}</p>
                            <p className="text-xs text-muted">
                              {component ? COMPONENT_META[component.type].label : ""}
                            </p>
                          </td>
                          <td>{entry.manager.fullName}</td>
                          <td>
                            <Badge variant={reviewed ? "success" : "warning"}>
                              {reviewed
                                ? isGoalReview && entry.pmReview?.score == null
                                  ? "Goal reviewed"
                                  : "PM Reviewed"
                                : "Awaiting PM"}
                            </Badge>
                          </td>
                          <td>
                            {reviewed && entry.pmReview?.score != null
                              ? `${entry.pmReview.score}%`
                              : "—"}
                          </td>
                          <td className="max-w-xs text-muted">{entry.pmReview?.comment ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {isSelfAssessment
            ? allEntries.map((entry) => {
                const component = plan.components.find((c) =>
                  c.entries.some((e) => e.id === entry.id),
                )!;
                const active = activeEntryId === entry.id;
                const done = Boolean(entry.selfAssessment);
                return (
                  <Card key={entry.id} className={cn(active && "border-accent")}>
                    {!active ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                              done ? "bg-success text-white" : "border border-border text-muted",
                            )}
                          >
                            {done ? "✓" : ""}
                          </span>
                          <p className="text-sm font-semibold text-navy">
                            {entry.title} · {COMPONENT_META[component.type].shortLabel}
                            {entry.selfAssessment
                              ? ` · ${RESULT_LABEL[entry.selfAssessment.result]}`
                              : ""}
                          </p>
                        </div>
                        <Button variant="link" onClick={() => startAssessment(entry)}>
                          {done ? "Edit" : "Start"}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {COMPONENT_META[component.type].label} · {component.weight}%
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold text-navy">{entry.title}</h2>
                        <div className="mt-4 rounded-lg bg-background p-3">
                          <p className="text-xs font-semibold uppercase text-muted">
                            Objectives & success criteria
                          </p>
                          <EntryObjectivesView className="mt-2" objectives={entry.objectives} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-navy">How did it go?</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(Object.keys(RESULT_LABEL) as Array<keyof typeof RESULT_LABEL>).map(
                            (key) => (
                              <button
                                key={key}
                                type="button"
                                className={cn(
                                  "rounded-lg border px-3 py-2 text-sm font-semibold",
                                  draftResult === key
                                    ? "border-accent bg-accent-soft"
                                    : "border-border",
                                )}
                                onClick={() => setDraftResult(key)}
                              >
                                {RESULT_LABEL[key]}
                              </button>
                            ),
                          )}
                        </div>
                        <div className="mt-4">
                          <Label htmlFor={`result-${entry.id}`}>
                            Your result & self-assessment
                          </Label>
                          <Textarea
                            id={`result-${entry.id}`}
                            className="mt-1 h-28"
                            value={draftText}
                            onChange={(event) => setDraftText(event.target.value)}
                          />
                        </div>
                        <div className="mt-3">
                          <Label htmlFor={`evidence-${entry.id}`}>Evidence link (optional)</Label>
                          <Input
                            id={`evidence-${entry.id}`}
                            value={draftEvidence}
                            onChange={(event) => setDraftEvidence(event.target.value)}
                            placeholder="Paste a link to a report, file or folder"
                          />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="secondary"
                            disabled={!draftResult || !draftText.trim() || saveAssessment.isPending}
                            onClick={() => saveAssessment.mutate(entry.id)}
                          >
                            Save & next entry
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            : null}

          {!isSelfAssessment && !showPmTracker
            ? plan.components
                .filter((c) => c.enabled)
                .map((component) => {
                  const unlocked = plan.status === "UNLOCKED" || component.lockState === "UNLOCKED";
                  const meta = COMPONENT_META[component.type];
                  return (
                    <Card key={component.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-3 w-3 rounded-sm", meta.colorClass)} />
                          <h2 className="font-bold text-navy">{meta.label}</h2>
                          {unlocked && isEditing ? (
                            <Badge variant="accent">Editing</Badge>
                          ) : !unlocked && isEditing ? (
                            <Badge variant="muted">Locked</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted">
                          {component.entries.length}{" "}
                          {component.entries.length === 1 ? "entry" : "entries"}
                        </p>
                      </div>
                      {unlocked && isEditing ? (
                        <div className="mt-4 space-y-4">
                          {editingEntries
                            .filter((e) => e.componentType === component.type)
                            .map((entry, index) => {
                              const globalIndex = editingEntries.findIndex(
                                (item) =>
                                  item === entry || (item.id && entry.id && item.id === entry.id),
                              );
                              return (
                                <div
                                  key={entry.id ?? `new-${index}`}
                                  className="rounded-lg border border-border p-4"
                                >
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <Label>Component</Label>
                                      <select
                                        className="h-11 w-full rounded-lg border border-border px-3 text-sm"
                                        value={entry.componentType}
                                        onChange={(event) => {
                                          const next = [...editingEntries];
                                          next[globalIndex] = {
                                            ...entry,
                                            componentType: event.target.value as ComponentType,
                                          };
                                          setEditingEntries(next);
                                        }}
                                      >
                                        {plan.components
                                          .filter((c) => c.enabled)
                                          .map((c) => (
                                            <option key={c.type} value={c.type}>
                                              {COMPONENT_META[c.type].label}
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                    <div className="md:col-span-2">
                                      <Label>Entry title</Label>
                                      <Input
                                        value={entry.title}
                                        onChange={(event) => {
                                          const next = [...editingEntries];
                                          next[globalIndex] = {
                                            ...entry,
                                            title: event.target.value,
                                          };
                                          setEditingEntries(next);
                                        }}
                                      />
                                    </div>
                                    <EntryObjectivesEditor
                                      value={entry.objectives}
                                      onChange={(objectives) => {
                                        const next = [...editingEntries];
                                        next[globalIndex] = { ...entry, objectives };
                                        setEditingEntries(next);
                                      }}
                                    />
                                    <div>
                                      <Label>Tagged manager</Label>
                                      <UserPicker
                                        value={entry.managerId}
                                        selectedLabel={
                                          entry.id
                                            ? allEntries.find((item) => item.id === entry.id)
                                                ?.manager.fullName
                                            : undefined
                                        }
                                        excludeUserId={plan.owner.id}
                                        placeholder="Search for a manager…"
                                        onChange={(managerId) => {
                                          const next = [...editingEntries];
                                          next[globalIndex] = {
                                            ...entry,
                                            managerId,
                                          };
                                          setEditingEntries(next);
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Label>Due date</Label>
                                      <Input
                                        type="date"
                                        value={entry.dueDate}
                                        onChange={(event) => {
                                          const next = [...editingEntries];
                                          next[globalIndex] = {
                                            ...entry,
                                            dueDate: event.target.value,
                                          };
                                          setEditingEntries(next);
                                        }}
                                      />
                                    </div>
                                  </div>
                                  {!entry.id ? (
                                    <Button
                                      className="mt-3"
                                      variant="link"
                                      onClick={() =>
                                        setEditingEntries((items) =>
                                          items.filter((_, i) => i !== globalIndex),
                                        )
                                      }
                                    >
                                      Remove unsaved entry
                                    </Button>
                                  ) : null}
                                </div>
                              );
                            })}
                          <Button
                            variant="link"
                            onClick={() =>
                              setEditingEntries((items) => [
                                ...items,
                                {
                                  componentType: component.type,
                                  title: "",
                                  objectives: emptyObjectives(),
                                  managerId: "",
                                  dueDate: `${plan.year}-12-31`,
                                },
                              ])
                            }
                          >
                            + Add another entry
                          </Button>
                        </div>
                      ) : component.entries.length === 0 ? (
                        <StateView
                          className="mt-4"
                          state="empty"
                          size="compact"
                          title="No entries yet"
                          description="Entries will appear here once they are added to this component."
                        />
                      ) : (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-muted">
                              <tr>
                                <th className="py-2">Entry</th>
                                <th>Objectives & criteria</th>
                                <th>Manager</th>
                                <th>Due</th>
                              </tr>
                            </thead>
                            <tbody>
                              {component.entries.map((entry) => (
                                <tr key={entry.id} className="border-t border-border align-top">
                                  <td className="py-3">
                                    <p className="font-semibold text-navy">{entry.title}</p>
                                  </td>
                                  <td className="max-w-md py-3">
                                    <EntryObjectivesView compact objectives={entry.objectives} />
                                  </td>
                                  <td>{entry.manager.fullName}</td>
                                  <td>
                                    {new Date(entry.dueDate).toLocaleDateString(undefined, {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  );
                })
            : null}
        </div>

        <div className="space-y-4">
          {isSelfAssessment ? (
            <>
              <Card>
                <CardTitle>Your progress</CardTitle>
                <p className="mt-2 text-2xl font-extrabold text-navy">
                  {assessedCount} of {allEntries.length}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${allEntries.length ? (assessedCount / allEntries.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </Card>
              <Card>
                <Button
                  size="full"
                  disabled={assessedCount < allEntries.length || submitPlan.isPending}
                  onClick={() => submitPlan.mutate()}
                >
                  Submit plan for review
                </Button>
                <p className="mt-2 text-xs text-muted">
                  Available once all entries have a result. After you submit, each tagged manager
                  scores their entries.
                </p>
                {submitPlan.isError ? (
                  <p className="mt-2 text-sm text-danger">{(submitPlan.error as Error).message}</p>
                ) : null}
              </Card>
            </>
          ) : null}

          {isInReview ? (
            <Card>
              <CardTitle>Weighted score</CardTitle>
              <p className="mt-2 text-3xl font-extrabold text-navy">
                {roundDisplay(planQuery.data?.score?.provisionalPoints ?? 0)}
                <span className="ml-2 text-base font-semibold text-muted">
                  of {planQuery.data?.score?.scoredWeightTotal ?? 0} points scored so far
                </span>
              </p>
              <p className="mt-2 text-xs text-muted">
                Provisional. The final score out of 100% appears when all components are scored.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {(planQuery.data?.score?.components ?? []).map((component) => (
                  <li key={component.type} className="flex justify-between gap-2">
                    <span>
                      {COMPONENT_META[component.type as ComponentType]?.shortLabel ??
                        component.type}
                    </span>
                    <span>
                      {component.weight}% ·{" "}
                      {component.score == null ? "—" : `${roundDisplay(component.score)}%`} ·{" "}
                      {component.points == null ? "—" : roundDisplay(component.points)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Line manager comment
                </p>
                <p className="mt-2 text-sm text-navy">
                  {plan.lineManagerComment ??
                    `${plan.owner.lineManager?.fullName ?? "Your line manager"} adds this once every entry is PM reviewed.`}
                </p>
              </div>
            </Card>
          ) : null}

          {!isSelfAssessment && !showPmTracker ? (
            <>
              <Card>
                <CardTitle>Plan details</CardTitle>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Created by</dt>
                    <dd>
                      {plan.createdBy.fullName} · {new Date(plan.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Status</dt>
                    <dd>{statusLabel(plan.status)}</dd>
                  </div>
                </dl>
              </Card>
              {isDraft ? (
                <Card>
                  <CardTitle>Draft plan</CardTitle>
                  <p className="mt-2 text-sm text-muted">
                    Keep editing until you are ready, then lock the plan so managers can review your
                    goals.
                  </p>
                  <Link
                    href="/app/plan/edit"
                    className="mt-3 inline-flex font-semibold text-accent"
                  >
                    Continue editing →
                  </Link>
                </Card>
              ) : null}
              {plan.status === "LOCKED" ? (
                <Card>
                  <CardTitle>Need to change something?</CardTitle>
                  <p className="mt-2 text-sm text-muted">
                    Your plan is locked. Ask the admin to unlock the whole plan or a single
                    component.
                  </p>
                  <Button className="mt-3" variant="link" onClick={() => setEditOpen(true)}>
                    Request edit access →
                  </Button>
                </Card>
              ) : null}
              {isEditing ? (
                <Card>
                  <CardTitle>Editing session</CardTitle>
                  <Button
                    className="mt-4"
                    size="full"
                    disabled={saveAndNotify.isPending}
                    onClick={() => saveAndNotify.mutate()}
                  >
                    Save changes & notify admin
                  </Button>
                  {saveAndNotify.isError ? (
                    <p className="mt-2 text-sm text-danger">
                      {(saveAndNotify.error as Error).message}
                    </p>
                  ) : null}
                  <CardTitle className="mt-6">Change history</CardTitle>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {plan.changeLogs.map((log) => (
                      <li key={log.id}>
                        {new Date(log.createdAt).toLocaleDateString()} ·{" "}
                        {log.action.replaceAll("_", " ").toLowerCase()}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <EditRequestModal open={editOpen} onClose={() => setEditOpen(false)} />
    </AppShell>
  );
}
