"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import { COMPONENT_META, type ComponentType } from "@/lib/plan";
import { cn } from "@/lib/utils";

type EntryResponse = {
  entry: {
    id: string;
    title: string;
    objective: string;
    successCriteria: string;
    dueDate: string;
    componentType: ComponentType;
    weight: number;
    owner: { id: string; fullName: string; jobTitle: string | null };
    submittedAt: string | null;
    selfAssessment: {
      result: "ACHIEVED" | "PARTLY" | "NOT";
      resultText: string;
      evidenceUrl: string | null;
    } | null;
    pmReview: { score: number | null; comment: string | null; status: string } | null;
  };
  queue: { awaitingCount: number; awaitingIds: string[] };
};

function scoreBand(score: number): string {
  if (score <= 49) return "Not met";
  if (score <= 79) return "Partly met";
  return "Met / exceeded";
}

const RESULT_LABEL = {
  ACHIEVED: "Achieved",
  PARTLY: "Partly achieved",
  NOT: "Not achieved",
} as const;

export function PmReviewClient() {
  const params = useParams<{ entryId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const entryId = params.entryId;

  const entryQuery = useQuery({
    queryKey: ["pm-entry", entryId],
    queryFn: () => apiFetch<EntryResponse>(`/pm/entries/${entryId}`),
  });

  const [score, setScore] = useState(80);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (entryQuery.data?.entry.pmReview) {
      setScore(entryQuery.data.entry.pmReview.score ?? 80);
      setComment(entryQuery.data.entry.pmReview.comment ?? "");
    }
  }, [entryQuery.data]);

  const band = useMemo(() => scoreBand(score), [score]);

  const saveDraft = useMutation({
    mutationFn: () =>
      apiFetch(`/pm/entries/${entryId}/review`, {
        method: "PUT",
        json: { score, comment },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pm-entries"] });
      router.push("/app/projects");
    },
  });

  const markReviewed = useMutation({
    mutationFn: () =>
      apiFetch<EntryResponse>(`/pm/entries/${entryId}/mark-reviewed`, {
        method: "POST",
        json: { score, comment },
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["pm-entries"] });
      const nextId = data.queue.awaitingIds.find((id) => id !== entryId);
      if (nextId) {
        router.push(`/app/projects/${nextId}`);
      } else {
        router.push("/app/projects");
      }
    },
  });

  if (entryQuery.isLoading) {
    return (
      <AppShell active="projects">
        <PlanPageSkeleton />
      </AppShell>
    );
  }

  if (entryQuery.isError || !entryQuery.data) {
    return (
      <AppShell active="projects">
        <StateView state="error" title="Entry not found" />
      </AppShell>
    );
  }

  const { entry, queue } = entryQuery.data;
  const meta = COMPONENT_META[entry.componentType];
  const readOnly = entry.pmReview?.status === "REVIEWED";

  return (
    <AppShell active="projects" userName="PM">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <Link href="/app/projects" className="text-accent">
            Projects I Manage
          </Link>{" "}
          / {entry.owner.fullName} / <span className="text-navy font-semibold">{entry.title}</span>
        </p>
        <p className="text-sm text-muted">
          Entry of {queue.awaitingCount} awaiting for {entry.owner.fullName.split(" ")[0]}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {meta.label} · {entry.weight}% of {entry.owner.fullName.split(" ")[0]}&apos;s plan
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-navy">{entry.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Owner: {entry.owner.fullName} · Due {new Date(entry.dueDate).toLocaleDateString()} ·{" "}
            {entry.submittedAt
              ? `Submitted ${new Date(entry.submittedAt).toLocaleDateString()}`
              : "Not submitted"}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-background p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-muted">Objective</p>
              <p className="mt-1">{entry.objective}</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-muted">Success criteria</p>
              <p className="mt-1">{entry.successCriteria}</p>
            </div>
          </div>
          {entry.selfAssessment ? (
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-navy">
                  {entry.owner.fullName.split(" ")[0]}&apos;s self-assessment
                </h2>
                <Badge variant="success">{RESULT_LABEL[entry.selfAssessment.result]}</Badge>
              </div>
              <p className="mt-2 text-sm">{entry.selfAssessment.resultText}</p>
              {entry.selfAssessment.evidenceUrl ? (
                <a
                  href={entry.selfAssessment.evidenceUrl}
                  className="mt-2 inline-block text-sm font-semibold text-accent"
                  target="_blank"
                  rel="noreferrer"
                >
                  Evidence →
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">Self-assessment not submitted yet.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Your review</CardTitle>
          <div className="mt-4">
            <Label htmlFor="score">Score (0–100%)</Label>
            <div className="mt-1 flex items-center gap-3">
              <Input
                id="score"
                type="number"
                min={0}
                max={100}
                className="w-24"
                value={score}
                disabled={readOnly}
                onChange={(event) => setScore(Number(event.target.value))}
              />
              <span className="text-sm font-semibold text-navy">{band}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              disabled={readOnly}
              onChange={(event) => setScore(Number(event.target.value))}
              className="mt-3 w-full accent-[var(--accent)]"
            />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              {(
                [
                  { label: "0–49%", sub: "Not met", active: score <= 49 },
                  { label: "50–79%", sub: "Partly met", active: score >= 50 && score <= 79 },
                  { label: "80–100%", sub: "Met / exceeded", active: score >= 80 },
                ] as const
              ).map((bandItem) => (
                <div
                  key={bandItem.label}
                  className={cn(
                    "rounded-lg border px-2 py-2",
                    bandItem.active
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-background",
                  )}
                >
                  <p className="font-semibold text-navy">{bandItem.label}</p>
                  <p className="text-muted">{bandItem.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="comment">PM comment</Label>
            <textarea
              id="comment"
              className="mt-1 min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={comment}
              disabled={readOnly}
              onChange={(event) => setComment(event.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              Visible to {entry.owner.fullName.split(" ")[0]} and their line manager.
            </p>
          </div>
          {!readOnly ? (
            <div className="mt-4 space-y-2">
              <Button
                size="full"
                disabled={!comment.trim() || markReviewed.isPending}
                onClick={() => markReviewed.mutate()}
              >
                Mark PM Reviewed & next entry
              </Button>
              <Button
                variant="link"
                className="w-full"
                disabled={saveDraft.isPending}
                onClick={() => saveDraft.mutate()}
              >
                Save draft & back to list
              </Button>
              {(markReviewed.isError || saveDraft.isError) && (
                <p className="text-sm text-danger">
                  {((markReviewed.error || saveDraft.error) as Error).message}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-success">This entry is already PM Reviewed.</p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
