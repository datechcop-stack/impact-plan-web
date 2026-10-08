"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PlanPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import {
  COMPONENT_META,
  roundDisplay,
  statusBadgeVariant,
  statusLabel,
  type ComponentType,
  type PlanStatus,
} from "@/lib/plan";
import { cn, initials } from "@/lib/utils";

const RESULT_LABEL = {
  ACHIEVED: "Achieved",
  PARTLY: "Partly achieved",
  NOT: "Not achieved",
} as const;

type PersonPlanResponse = {
  plan: {
    id: string;
    year: number;
    status: PlanStatus;
    submittedAt: string | null;
    lineManagerComment: string | null;
    recommendation: string | null;
    owner: { id: string; fullName: string; jobTitle: string | null };
    components: Array<{
      type: ComponentType;
      enabled: boolean;
      weight: number;
      entries: Array<{
        id: string;
        title: string;
        selfAssessment: {
          result: "ACHIEVED" | "PARTLY" | "NOT";
          resultText: string;
        } | null;
        pmReview: {
          score: number | null;
          comment: string | null;
          status: string;
          reviewer: { fullName: string };
        } | null;
      }>;
    }>;
  };
  score: {
    components: Array<{
      type: ComponentType;
      weight: number;
      score: number | null;
      points: number | null;
    }>;
    finalScore: number | null;
    isComplete: boolean;
  };
  checklist: {
    selfAssessmentSubmitted: boolean;
    pmReviewed: boolean;
    pmDone: number;
    pmTotal: number;
    commentAdded: boolean;
  };
};

export function FinalizeClient() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const planQuery = useQuery({
    queryKey: ["lm-plan", params.userId],
    queryFn: () => apiFetch<PersonPlanResponse>(`/lm/people/${params.userId}/plan?year=2026`),
  });

  useEffect(() => {
    if (planQuery.data?.plan.lineManagerComment) {
      setComment(planQuery.data.plan.lineManagerComment);
    }
    if (planQuery.data?.plan.recommendation) {
      setRecommendation(planQuery.data.plan.recommendation);
    }
  }, [planQuery.data]);

  const finalizeMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/lm/people/${params.userId}/plan/finalize`, {
        method: "POST",
        json: { comment, recommendation: recommendation.trim() || undefined },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lm-people"] });
      router.push("/app/people");
    },
  });

  if (planQuery.isLoading) {
    return (
      <AppShell active="people">
        <PlanPageSkeleton />
      </AppShell>
    );
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <AppShell active="people">
        <StateView state="error" title="Plan not found" />
      </AppShell>
    );
  }

  const { plan, score, checklist } = planQuery.data;
  const canFinalize =
    checklist.selfAssessmentSubmitted &&
    checklist.pmReviewed &&
    comment.trim().length > 0 &&
    plan.status === "IN_REVIEW";

  return (
    <AppShell active="people" userName="LM">
      <Link href="/app/people" className="text-sm font-semibold text-accent">
        ← People You Manage
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-navy">
          {initials(plan.owner.fullName)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-navy">
              {plan.owner.fullName} · Impact Plan {plan.year}
            </h1>
            <Badge variant={statusBadgeVariant(plan.status)}>{statusLabel(plan.status)}</Badge>
          </div>
          <p className="text-sm text-muted">
            {plan.owner.jobTitle ?? "Staff"}
            {plan.submittedAt
              ? ` · Submitted ${new Date(plan.submittedAt).toLocaleDateString()}`
              : ""}
            {checklist.pmReviewed ? " · All entries PM Reviewed" : ""}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {plan.components
            .filter((c) => c.enabled)
            .map((component) => {
              const componentScore = score.components.find((c) => c.type === component.type);
              return (
                <Card key={component.type}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-3 w-3 rounded-sm",
                          COMPONENT_META[component.type].colorClass,
                        )}
                      />
                      <h2 className="font-bold text-navy">
                        {COMPONENT_META[component.type].label}
                      </h2>
                    </div>
                    <p className="text-sm text-muted">
                      Weight {component.weight}% · Component score{" "}
                      {componentScore?.score == null
                        ? "—"
                        : `${roundDisplay(componentScore.score)}%`}
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {component.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid gap-3 border-t border-border pt-3 md:grid-cols-[1.2fr_1fr_0.4fr_1fr]"
                      >
                        <div>
                          <p className="font-semibold text-navy">{entry.title}</p>
                          {entry.selfAssessment ? (
                            <Badge
                              className="mt-1"
                              variant={
                                entry.selfAssessment.result === "ACHIEVED" ? "success" : "warning"
                              }
                            >
                              {RESULT_LABEL[entry.selfAssessment.result]}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted">
                          {entry.selfAssessment?.resultText ?? "—"}
                        </p>
                        <p className="font-semibold text-navy">
                          {entry.pmReview?.score != null ? `${entry.pmReview.score}%` : "—"}
                        </p>
                        <p className="text-sm text-muted">
                          {entry.pmReview?.reviewer.fullName
                            ? `${entry.pmReview.reviewer.fullName}: ${entry.pmReview.comment ?? ""}`
                            : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          <p className="text-xs text-muted">
            Columns: entry & self-rated status · owner&apos;s result · PM score · PM comment
          </p>
        </div>

        <div className="space-y-4">
          <Card className="bg-navy text-white">
            <p className="text-sm font-semibold text-white/80">Final weighted score</p>
            <p className="mt-2 text-4xl font-extrabold">
              {score.finalScore == null ? "—" : `${roundDisplay(score.finalScore)}%`}
            </p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/20">
              {score.components.map((component) => (
                <div
                  key={component.type}
                  className={COMPONENT_META[component.type].colorClass}
                  style={{ width: `${component.weight}%` }}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-1 text-sm text-white/85">
              {score.components.map((component) => (
                <li key={component.type}>
                  {COMPONENT_META[component.type].shortLabel}{" "}
                  {component.score == null ? "—" : roundDisplay(component.score)} ×{" "}
                  {component.weight}% ={" "}
                  {component.points == null ? "—" : roundDisplay(component.points)}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle>Your overall comment</CardTitle>
            <p className="mt-1 text-sm text-muted">
              One comment for the whole year. Separate from each PM&apos;s comment.
            </p>
            <Label htmlFor="lm-comment" className="sr-only">
              Overall comment
            </Label>
            <textarea
              id="lm-comment"
              className="mt-3 min-h-32 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={comment}
              disabled={plan.status === "FINALIZED"}
              onChange={(event) => setComment(event.target.value)}
            />
            <Label
              htmlFor="lm-recommendation"
              className="mt-4 block text-sm font-semibold text-navy"
            >
              Recommendation (optional)
            </Label>
            <textarea
              id="lm-recommendation"
              className="mt-2 min-h-24 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={recommendation}
              disabled={plan.status === "FINALIZED"}
              placeholder="Promotion, development focus, or other LT recommendation"
              onChange={(event) => setRecommendation(event.target.value)}
            />
            <ul className="mt-4 space-y-2 text-sm">
              <li className={checklist.selfAssessmentSubmitted ? "text-success" : "text-muted"}>
                {checklist.selfAssessmentSubmitted ? "✓" : "○"} Self-assessment submitted
              </li>
              <li className={checklist.pmReviewed ? "text-success" : "text-muted"}>
                {checklist.pmReviewed ? "✓" : "○"} {checklist.pmDone} of {checklist.pmTotal} entries
                PM Reviewed
              </li>
              <li className={comment.trim() ? "text-success" : "text-muted"}>
                {comment.trim() ? "✓" : "○"} Overall comment added
              </li>
            </ul>
            {plan.status !== "FINALIZED" ? (
              <>
                <Button
                  className="mt-4"
                  size="full"
                  disabled={!canFinalize || finalizeMutation.isPending}
                  onClick={() => finalizeMutation.mutate()}
                >
                  Finalize plan
                </Button>
                <p className="mt-2 text-xs text-muted">
                  Finalizing archives the plan for {plan.year}. It can&apos;t be edited afterwards
                  without the admin.
                </p>
                {finalizeMutation.isError ? (
                  <p className="mt-2 text-sm text-danger">
                    {(finalizeMutation.error as Error).message}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-sm text-success">This plan is finalized.</p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
