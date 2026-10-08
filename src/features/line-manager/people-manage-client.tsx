"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import { cn, initials } from "@/lib/utils";

type PeopleResponse = {
  counts: {
    all: number;
    draft: number;
    locked: number;
    inReview: number;
    finalized: number;
  };
  yearEndProgress: { finalized: number; total: number };
  items: Array<{
    id: string;
    fullName: string;
    jobTitle: string | null;
    uiStatus: "DRAFT" | "LOCKED" | "IN_REVIEW" | "FINALIZED";
    selfAssessment: string;
    pmReviews: { done: number; total: number; ready: boolean };
    weightedScore: number | null;
  }>;
};

export function PeopleManageClient() {
  const [status, setStatus] = useState("ALL");
  const queryClient = useQueryClient();

  const peopleQuery = useQuery({
    queryKey: ["lm-people", status],
    queryFn: () => apiFetch<PeopleResponse>(`/lm/people?year=2026&status=${status}`),
  });

  const remindMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/lm/people/${userId}/remind`, { method: "POST", json: {} }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["lm-people"] }),
  });

  return (
    <AppShell active="people">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent">LINE MANAGER</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            People You Manage
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Your direct reports. Once every entry is PM Reviewed, add your overall comment and
            finalize the plan.
          </p>
        </div>
        {peopleQuery.data ? (
          <div className="min-w-40">
            <p className="text-xs text-muted">Year-end progress</p>
            <p className="text-sm font-semibold text-navy">
              {peopleQuery.data.yearEndProgress.finalized} of{" "}
              {peopleQuery.data.yearEndProgress.total} finalized
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-success"
                style={{
                  width: `${
                    peopleQuery.data.yearEndProgress.total
                      ? (peopleQuery.data.yearEndProgress.finalized /
                          peopleQuery.data.yearEndProgress.total) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {peopleQuery.isLoading ? (
        <ListPageSkeleton stats={0} />
      ) : peopleQuery.isError ? (
        <StateView className="mt-8" state="error" />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["ALL", `All · ${peopleQuery.data!.counts.all}`],
                ["DRAFT", `Draft · ${peopleQuery.data!.counts.draft}`],
                ["LOCKED", `Locked · ${peopleQuery.data!.counts.locked}`],
                ["IN_REVIEW", `In Review · ${peopleQuery.data!.counts.inReview}`],
                ["FINALIZED", `Finalized · ${peopleQuery.data!.counts.finalized}`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold",
                  status === value
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-muted",
                )}
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {peopleQuery.data!.items.length === 0 ? (
            <StateView className="mt-8" state="empty" title="No people in this filter" />
          ) : (
            <Card className="mt-6 overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-background text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Person</th>
                    <th>Plan status</th>
                    <th>Self-assessment</th>
                    <th>PM reviews</th>
                    <th>Weighted score</th>
                    <th className="px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {peopleQuery.data!.items.map((person) => (
                    <tr key={person.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-navy">
                            {initials(person.fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-navy">{person.fullName}</p>
                            <p className="text-muted">{person.jobTitle ?? "Staff"}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            person.uiStatus === "FINALIZED"
                              ? "success"
                              : person.uiStatus === "IN_REVIEW"
                                ? "warning"
                                : "default"
                          }
                        >
                          {person.uiStatus.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td>{person.selfAssessment}</td>
                      <td>
                        <span
                          className={cn(
                            person.pmReviews.ready ? "font-bold text-success" : "text-muted",
                          )}
                        >
                          {person.pmReviews.done} / {person.pmReviews.total}
                        </span>
                        {person.pmReviews.ready
                          ? " · ready for you"
                          : person.uiStatus === "IN_REVIEW"
                            ? " · waiting on PMs"
                            : ""}
                      </td>
                      <td>{person.weightedScore != null ? `${person.weightedScore}%` : "—"}</td>
                      <td className="px-4">
                        {person.pmReviews.ready ? (
                          <Link
                            href={`/app/people/${person.id}`}
                            className="inline-flex h-9 items-center rounded-lg bg-navy px-3 text-xs font-semibold text-white"
                          >
                            Review & finalize
                          </Link>
                        ) : person.uiStatus === "LOCKED" ? (
                          <button
                            type="button"
                            className="text-sm font-semibold text-accent"
                            onClick={() => remindMutation.mutate(person.id)}
                          >
                            Send reminder
                          </button>
                        ) : (
                          <Link
                            href={`/app/people/${person.id}`}
                            className="text-sm font-semibold text-accent"
                          >
                            {person.uiStatus === "FINALIZED" ? "View" : "View plan"}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
