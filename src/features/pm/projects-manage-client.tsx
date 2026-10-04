"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import { COMPONENT_META, type ComponentType } from "@/lib/plan";
import { cn, initials } from "@/lib/utils";

type PmListResponse = {
  stats: { tagged: number; awaiting: number; notSubmitted: number; reviewed: number };
  groups: Array<{
    owner: { id: string; fullName: string; jobTitle: string | null };
    submittedAt: string | null;
    awaiting: number;
    reviewed: number;
    notSubmitted: boolean;
    entries: Array<{
      id: string;
      title: string;
      componentType: ComponentType;
      status: "AWAITING" | "NOT_SUBMITTED" | "REVIEWED";
      score: number | null;
    }>;
  }>;
};

export function ProjectsManageClient() {
  const [q, setQ] = useState("");
  const [component, setComponent] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const listQuery = useQuery({
    queryKey: ["pm-entries", q, component, status],
    queryFn: () =>
      apiFetch<PmListResponse>(
        `/pm/entries?year=2026&q=${encodeURIComponent(q)}&component=${component}&status=${status}`,
      ),
  });

  return (
    <AppShell active="projects">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent">MANAGER</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        Projects I Manage
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Entries across all components where you&apos;re tagged as the Manager.
      </p>

      {listQuery.isLoading ? (
        <ListPageSkeleton />
      ) : listQuery.isError ? (
        <StateView className="mt-8" state="error" description="Sign in to view tagged entries." />
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["Tagged entries", listQuery.data!.stats.tagged, false],
                ["Awaiting your score", listQuery.data!.stats.awaiting, true],
                ["Owner hasn't submitted", listQuery.data!.stats.notSubmitted, false],
                ["PM Reviewed", listQuery.data!.stats.reviewed, false],
              ] as const
            ).map(([label, value, highlight]) => (
              <Card
                key={label}
                className={cn("relative overflow-hidden", highlight && "border-accent")}
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-1",
                    highlight
                      ? "bg-gradient-to-r from-accent to-accent/30"
                      : "bg-gradient-to-r from-navy/40 to-navy/10",
                  )}
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <p
                  className={cn(
                    "mt-3 text-3xl font-extrabold tracking-tight",
                    label === "PM Reviewed" ? "text-success" : "text-navy",
                  )}
                >
                  {value}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Input
              className="max-w-sm"
              placeholder="Search people or entries"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <select
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
              value={component}
              onChange={(event) => setComponent(event.target.value)}
            >
              <option value="ALL">All components</option>
              {(Object.keys(COMPONENT_META) as ComponentType[]).map((type) => (
                <option key={type} value={type}>
                  {COMPONENT_META[type].label}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="AWAITING">Awaiting score</option>
              <option value="NOT_SUBMITTED">Owner hasn&apos;t submitted</option>
              <option value="REVIEWED">PM Reviewed</option>
            </select>
          </div>

          {listQuery.data!.groups.length === 0 ? (
            <StateView className="mt-8" state="empty" title="No tagged entries" />
          ) : (
            <div className="mt-6 space-y-4">
              {listQuery.data!.groups.map((group) => (
                <Card key={group.owner.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-navy">
                        {initials(group.owner.fullName)}
                      </div>
                      <div>
                        <p className="font-bold text-navy">{group.owner.fullName}</p>
                        <p className="text-sm text-muted">
                          {group.owner.jobTitle ?? "Staff"}
                          {group.submittedAt
                            ? ` · submitted ${new Date(group.submittedAt).toLocaleDateString()}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    {group.notSubmitted ? (
                      <Badge variant="muted">Self-assessment not submitted</Badge>
                    ) : (
                      <p className="text-sm text-muted">
                        {group.awaiting} awaiting · {group.reviewed} reviewed
                      </p>
                    )}
                  </div>
                  {!group.notSubmitted ? (
                    <div className="mt-4 divide-y divide-border">
                      {group.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div>
                            <p className="font-semibold text-navy">{entry.title}</p>
                            <p className="text-sm text-muted">
                              {COMPONENT_META[entry.componentType].label}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                entry.status === "REVIEWED"
                                  ? "success"
                                  : entry.status === "AWAITING"
                                    ? "warning"
                                    : "muted"
                              }
                            >
                              {entry.status === "REVIEWED"
                                ? `PM Reviewed · ${entry.score}%`
                                : entry.status === "AWAITING"
                                  ? "Awaiting score"
                                  : "Not submitted"}
                            </Badge>
                            {entry.status === "AWAITING" ? (
                              <Link
                                href={`/app/projects/${entry.id}`}
                                className="inline-flex h-9 items-center rounded-lg bg-navy px-3 text-xs font-semibold text-white hover:bg-navy-soft"
                              >
                                Review
                              </Link>
                            ) : entry.status === "REVIEWED" ? (
                              <Link
                                href={`/app/projects/${entry.id}`}
                                className="text-sm font-semibold text-accent"
                              >
                                View
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
