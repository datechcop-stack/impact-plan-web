"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { DashboardOverviewSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";

type Overview = {
  year: number;
  stats: {
    activeStaff: number;
    plansCreated: number;
    locked: number;
    inReview: number;
    finalized: number;
    noPlanYet: number;
  };
  attention: {
    pendingEditRequests: number;
    staffWithoutPlan: number;
    pendingInvites: number;
    reviewWindowOpens: string | null;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    actorName: string;
    createdAt: string;
  }>;
};

export function AdminOverviewClient() {
  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => apiFetch<Overview>("/admin/overview"),
  });

  return (
    <AdminShell active="overview">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent">ADMIN</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            {overviewQuery.data?.year ?? 2026} cycle overview
          </h1>
          <p className="mt-1.5 text-sm text-muted">Where every Impact Plan stands this year.</p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-white shadow-sm shadow-navy/20 transition-all hover:bg-navy-soft"
        >
          + Invite user
        </Link>
      </div>
      {overviewQuery.isLoading ? (
        <DashboardOverviewSkeleton />
      ) : overviewQuery.isError ? (
        <StateView
          className="mt-8"
          state="error"
          title="Could not load overview"
          description="Sign in as an admin to view this page."
          action={
            <Link href="/sign-in" className="font-semibold text-accent">
              Sign in
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {(
              [
                ["Active staff", overviewQuery.data!.stats.activeStaff],
                ["Plans created", overviewQuery.data!.stats.plansCreated],
                ["Locked", overviewQuery.data!.stats.locked],
                ["In review", overviewQuery.data!.stats.inReview],
                ["Finalized", overviewQuery.data!.stats.finalized],
              ] as const
            ).map(([label, value]) => (
              <Card key={label} className="relative overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/80 to-accent/20"
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-navy">{value}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Needs your attention</CardTitle>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2.5">
                  <span>
                    {overviewQuery.data!.attention.pendingEditRequests} edit requests waiting
                  </span>
                  <Link href="/admin/edit-requests" className="font-semibold text-accent">
                    Review →
                  </Link>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2.5">
                  <span>
                    {overviewQuery.data!.attention.staffWithoutPlan} staff don&apos;t have a plan
                    yet
                  </span>
                  <Link href="/admin/plans" className="font-semibold text-accent">
                    Create →
                  </Link>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2.5">
                  <span>
                    {overviewQuery.data!.attention.pendingInvites} invitations pending or expired
                  </span>
                  <Link href="/admin/users" className="font-semibold text-accent">
                    Resend →
                  </Link>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2.5">
                  <span>
                    Review window opens {overviewQuery.data!.attention.reviewWindowOpens ?? "—"}
                  </span>
                  <Link href="/admin/review-cycle" className="font-semibold text-accent">
                    Settings →
                  </Link>
                </li>
              </ul>
            </Card>
            <Card>
              <CardTitle>Recent activity</CardTitle>
              {overviewQuery.data!.recentActivity.length === 0 ? (
                <StateView
                  className="mt-3"
                  state="empty"
                  size="compact"
                  title="No activity yet"
                  description="Invites, plan changes, and reviews will appear here."
                />
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {overviewQuery.data!.recentActivity.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-3 rounded-xl px-1 py-2 hover:bg-background/70"
                    >
                      <span>
                        {item.actorName}: {item.action.replaceAll("_", " ").toLowerCase()}
                      </span>
                      <span className="shrink-0 text-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </AdminShell>
  );
}
