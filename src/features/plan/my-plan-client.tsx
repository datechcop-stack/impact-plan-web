"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PlanProgress } from "@/components/plan/plan-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateView } from "@/components/ui/state-view";
import { EditRequestModal } from "@/features/plan/edit-request-modal";
import type { MyPlanResponse, PlanEntry } from "@/features/plan/types";
import { UserPicker } from "@/components/ui/user-picker";
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
      objective: string;
      successCriteria: string;
      managerId: string;
      dueDate: string;
    }>
  >([]);
  const [removedEntryIds, setRemovedEntryIds] = useState<string[]>([]);

  const planQuery = useQuery({
    queryKey: ["my-plan"],
    queryFn: () => apiFetch<MyPlanResponse>("/me/plan?year=2026"),
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
  const pmDone = allEntries.filter((e) => e.pmReview?.status === "REVIEWED").length;

  function startAssessment(entry: PlanEntry) {
    setActiveEntryId(entry.id);
    setDraftResult(entry.selfAssessment?.result ?? null);
    setDraftText(entry.selfAssessment?.resultText ?? "");
    setDraftEvidence(entry.selfAssessment?.evidenceUrl ?? "");
  }

  const isEditing =
    planQuery.data?.plan.status === "PARTLY_UNLOCKED" || planQuery.data?.plan.status === "UNLOCKED";

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
          objective: entry.objective,
          successCriteria: entry.successCriteria,
          managerId: entry.manager.id,
          dueDate: entry.dueDate.slice(0, 10),
        })),
      ),
    );
  }, [planQuery.data?.plan, editingEntries.length]);

  if (planQuery.isLoading) {
    return (
      <AppShell active="plan">
        <StateView state="loading" title="Loading your plan…" />
      </AppShell>
    );
  }

  if (planQuery.isError || !plan) {
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

  const isSelfAssessment = plan.status === "REVIEW_OPEN";
  const isInReview = plan.status === "IN_REVIEW" || plan.status === "FINALIZED";

  return (
    <AppShell active="plan" userName={plan.owner.fullName}>
      {isEditing ? (
        <div className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-navy">
          A component is unlocked for editing. Save changes & notify admin when you are done.
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-navy">
              {isSelfAssessment ? `Self-assessment ${plan.year}` : `My Impact Plan ${plan.year}`}
            </h1>
            <Badge variant={statusBadgeVariant(plan.status)}>{statusLabel(plan.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {plan.owner.fullName}
            {plan.owner.jobTitle ? ` · ${plan.owner.jobTitle}` : ""}
            {plan.owner.lineManager ? ` · Line manager: ${plan.owner.lineManager.fullName}` : ""}
          </p>
        </div>
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
          {isInReview ? (
            <Card>
              <CardTitle>Review tracker</CardTitle>
              <p className="mt-1 text-sm text-muted">
                {plan.submittedAt
                  ? `Submitted ${new Date(plan.submittedAt).toLocaleDateString()}. `
                  : ""}
                Your plan is read-only while managers review it.
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
                      const reviewed = entry.pmReview?.status === "REVIEWED";
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
                              {reviewed ? "PM Reviewed" : "Awaiting PM"}
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
              <p className="mt-4 text-sm text-muted">
                Line manager comment:{" "}
                {plan.lineManagerComment ??
                  `${plan.owner.lineManager?.fullName ?? "Your line manager"} adds this once every entry is PM Reviewed.`}
              </p>
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
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg bg-background p-3 text-sm">
                            <p className="text-xs font-semibold uppercase text-muted">Objective</p>
                            <p className="mt-1">{entry.objective}</p>
                          </div>
                          <div className="rounded-lg bg-background p-3 text-sm">
                            <p className="text-xs font-semibold uppercase text-muted">
                              Success criteria
                            </p>
                            <p className="mt-1">{entry.successCriteria}</p>
                          </div>
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
                          <textarea
                            id={`result-${entry.id}`}
                            className="mt-1 min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm"
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

          {!isSelfAssessment && !isInReview
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
                          {component.entries.length === 1 ? "entry" : "entries"} ·{" "}
                          {component.weight}% weight
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
                                    <div>
                                      <Label>Objective</Label>
                                      <textarea
                                        className="min-h-20 w-full rounded-lg border border-border px-3 py-2 text-sm"
                                        value={entry.objective}
                                        onChange={(event) => {
                                          const next = [...editingEntries];
                                          next[globalIndex] = {
                                            ...entry,
                                            objective: event.target.value,
                                          };
                                          setEditingEntries(next);
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Label>Success criteria</Label>
                                      <textarea
                                        className="min-h-20 w-full rounded-lg border border-border px-3 py-2 text-sm"
                                        value={entry.successCriteria}
                                        onChange={(event) => {
                                          const next = [...editingEntries];
                                          next[globalIndex] = {
                                            ...entry,
                                            successCriteria: event.target.value,
                                          };
                                          setEditingEntries(next);
                                        }}
                                      />
                                    </div>
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
                                  {entry.id ? (
                                    <Button
                                      className="mt-3"
                                      variant="link"
                                      onClick={() => {
                                        setRemovedEntryIds((ids) => [...ids, entry.id!]);
                                        setEditingEntries((items) =>
                                          items.filter((_, i) => i !== globalIndex),
                                        );
                                      }}
                                    >
                                      Remove
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
                                  objective: "",
                                  successCriteria: "",
                                  managerId: "",
                                  dueDate: `${plan.year}-12-31`,
                                },
                              ])
                            }
                          >
                            + Add another entry
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-muted">
                              <tr>
                                <th className="py-2">Entry & objective</th>
                                <th>Success criteria</th>
                                <th>Manager</th>
                                <th>Due</th>
                              </tr>
                            </thead>
                            <tbody>
                              {component.entries.map((entry) => (
                                <tr key={entry.id} className="border-t border-border align-top">
                                  <td className="py-3">
                                    <p className="font-semibold text-navy">{entry.title}</p>
                                    <p className="text-muted">{entry.objective}</p>
                                  </td>
                                  <td className="max-w-xs">{entry.successCriteria}</td>
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
                {roundDisplay(planQuery.data!.score.provisionalPoints)}
                <span className="ml-2 text-base font-semibold text-muted">
                  of {planQuery.data!.score.scoredWeightTotal} points scored so far
                </span>
              </p>
              <p className="mt-2 text-xs text-muted">
                Provisional. The final score out of 100% appears when all components are scored.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {planQuery.data!.score.components.map((component) => (
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
            </Card>
          ) : null}

          {!isSelfAssessment && !isInReview ? (
            <>
              <Card>
                <CardTitle>Component weights</CardTitle>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                  {plan.components
                    .filter((c) => c.enabled)
                    .map((c) => (
                      <div
                        key={c.id}
                        className={COMPONENT_META[c.type].colorClass}
                        style={{ width: `${c.weight}%` }}
                      />
                    ))}
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {plan.components
                    .filter((c) => c.enabled)
                    .map((c) => (
                      <li key={c.id} className="flex justify-between">
                        <span>{COMPONENT_META[c.type].label}</span>
                        <span>{c.weight}%</span>
                      </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-muted">
                  Weights are set by your administrator and always total 100%.
                </p>
              </Card>
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
