"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PlanPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { EntryObjectivesView } from "@/features/plan/entry-objectives-view";
import type { ObjectiveView } from "@/features/plan/objectives";
import { UserPicker } from "@/components/ui/user-picker";
import { apiFetch } from "@/lib/api/client";
import {
  COMPONENT_META,
  statusBadgeVariant,
  statusLabel,
  type ComponentType,
  type PlanStatus,
} from "@/lib/plan";

type AdminPlanDetail = {
  id: string;
  year: number;
  status: PlanStatus;
  finalScore: number | null;
  lineManagerComment: string | null;
  recommendation: string | null;
  createdAt: string;
  lockedAt: string | null;
  submittedAt: string | null;
  owner: {
    id: string;
    fullName: string;
    email: string;
    jobTitle: string | null;
    lineManager: { fullName: string } | null;
  };
  components: Array<{
    id: string;
    type: ComponentType;
    enabled: boolean;
    weight: number;
    lockState: "LOCKED" | "UNLOCKED";
    entries: Array<{
      id: string;
      title: string;
      objectives: ObjectiveView[];
      dueDate: string;
      manager: { id: string; fullName: string };
      selfAssessment: {
        result: "ACHIEVED" | "PARTLY" | "NOT";
        resultText: string;
      } | null;
      pmReview: {
        score: number | null;
        comment: string | null;
        status: string;
      } | null;
    }>;
  }>;
  changeLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor: { fullName: string } | null;
  }>;
};

export function AdminPlanDetailClient() {
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const queryClient = useQueryClient();

  const planQuery = useQuery({
    queryKey: ["admin-plan", planId],
    queryFn: () => apiFetch<AdminPlanDetail>(`/admin/plans/${planId}`),
  });

  const lockMutation = useMutation({
    mutationFn: () => apiFetch(`/admin/plans/${planId}/lock`, { method: "POST", json: {} }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-plan", planId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    },
  });

  const relockMutation = useMutation({
    mutationFn: () => apiFetch(`/admin/plans/${planId}/relock`, { method: "POST", json: {} }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-plan", planId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    },
  });

  const reassignManagerMutation = useMutation({
    mutationFn: ({ entryId, managerId }: { entryId: string; managerId: string }) =>
      apiFetch(`/admin/plans/${planId}/entries/${entryId}/manager`, {
        method: "PATCH",
        json: { managerId },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-plan", planId] });
    },
  });

  if (planQuery.isLoading) {
    return (
      <AdminShell active="plans">
        <PlanPageSkeleton />
      </AdminShell>
    );
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <AdminShell active="plans">
        <StateView
          state="error"
          title="Plan not found"
          description="This plan may have been removed, or you need to sign in as admin."
        />
        <Link href="/admin/plans" className="mt-4 inline-block text-sm font-semibold text-accent">
          ← Back to plans
        </Link>
      </AdminShell>
    );
  }

  const plan = planQuery.data;
  const canLock = plan.status === "DRAFT";
  const canRelock = plan.status === "UNLOCKED" || plan.status === "PARTLY_UNLOCKED";

  return (
    <AdminShell active="plans">
      <Link href="/admin/plans" className="text-sm font-semibold text-accent">
        ← Impact plans
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-navy">{plan.owner.fullName}</h1>
            <Badge variant={statusBadgeVariant(plan.status)}>{statusLabel(plan.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {plan.year} · {plan.owner.jobTitle ?? plan.owner.email}
            {plan.owner.lineManager ? ` · Line manager: ${plan.owner.lineManager.fullName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canLock ? (
            <Button onClick={() => lockMutation.mutate()} disabled={lockMutation.isPending}>
              Lock plan
            </Button>
          ) : null}
          {canRelock ? (
            <Button
              variant="secondary"
              onClick={() => relockMutation.mutate()}
              disabled={relockMutation.isPending}
            >
              Re-lock plan
            </Button>
          ) : null}
        </div>
      </div>

      {(lockMutation.isError || relockMutation.isError) && (
        <p className="mt-3 text-sm text-danger">
          {((lockMutation.error ?? relockMutation.error) as Error).message}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {plan.components
            .filter((component) => component.enabled)
            .map((component) => {
              const meta = COMPONENT_META[component.type];
              return (
                <Card key={component.id}>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{meta.label}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{component.weight}%</span>
                      <Badge variant={meta.badge}>{component.lockState}</Badge>
                    </div>
                  </div>
                  {component.entries.length === 0 ? (
                    <StateView
                      className="mt-3"
                      state="empty"
                      size="compact"
                      title="No entries yet"
                      description="This component has no entries on the plan."
                    />
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {component.entries.map((entry) => (
                        <li
                          key={entry.id}
                          className="border-t border-border pt-4 first:border-0 first:pt-0"
                        >
                          <p className="font-semibold text-navy">{entry.title}</p>
                          <EntryObjectivesView
                            className="mt-2"
                            compact
                            objectives={entry.objectives}
                          />
                          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                            <div>
                              <p className="text-xs font-semibold text-muted">Project manager</p>
                              <UserPicker
                                className="mt-1"
                                value={entry.manager.id}
                                selectedLabel={entry.manager.fullName}
                                excludeUserId={plan.owner.id}
                                placeholder="Reassign manager…"
                                onChange={(managerId) =>
                                  reassignManagerMutation.mutate({ entryId: entry.id, managerId })
                                }
                              />
                            </div>
                            <p className="text-xs text-muted">
                              Due {new Date(entry.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          {entry.selfAssessment ? (
                            <p className="mt-2 text-sm">
                              Self: {entry.selfAssessment.result} —{" "}
                              {entry.selfAssessment.resultText}
                            </p>
                          ) : null}
                          {entry.pmReview?.status === "REVIEWED" ? (
                            <p className="mt-1 text-sm">
                              PM: {entry.pmReview.score ?? "—"}
                              {entry.pmReview.comment ? ` — ${entry.pmReview.comment}` : ""}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Leadership team snapshot</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Use this block when presenting year-end results to LT.
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted">Impact plan score</dt>
                <dd className="mt-1 text-2xl font-extrabold text-navy">
                  {plan.finalScore != null ? `${plan.finalScore}%` : "Not finalized"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted">Line manager comment</dt>
                <dd className="mt-1 text-navy">{plan.lineManagerComment ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted">Recommendation</dt>
                <dd className="mt-1 text-navy">{plan.recommendation ?? "—"}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardTitle>Summary</CardTitle>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Email</dt>
                <dd className="text-right text-navy">{plan.owner.email}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Created</dt>
                <dd className="text-right text-navy">
                  {new Date(plan.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Locked</dt>
                <dd className="text-right text-navy">
                  {plan.lockedAt ? new Date(plan.lockedAt).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Submitted</dt>
                <dd className="text-right text-navy">
                  {plan.submittedAt ? new Date(plan.submittedAt).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Final score</dt>
                <dd className="text-right font-semibold text-navy">
                  {plan.finalScore != null ? `${plan.finalScore}%` : "—"}
                </dd>
              </div>
            </dl>
            {plan.lineManagerComment ? (
              <p className="mt-4 border-t border-border pt-3 text-sm text-muted">
                {plan.lineManagerComment}
              </p>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Recent activity</CardTitle>
            {plan.changeLogs.length === 0 ? (
              <StateView
                className="mt-3"
                state="empty"
                size="compact"
                title="No activity yet"
                description="Changes to this plan will show up here."
              />
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {plan.changeLogs.map((log) => (
                  <li key={log.id}>
                    <p className="font-semibold text-navy">
                      {log.action.replaceAll("_", " ").toLowerCase()}
                    </p>
                    <p className="text-xs text-muted">
                      {log.actor?.fullName ?? "System"} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
