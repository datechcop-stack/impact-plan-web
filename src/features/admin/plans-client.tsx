"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import { useState } from "react";

type PlanItem = {
  id: string;
  year: number;
  status: string;
  owner: { id: string; fullName: string; email: string; jobTitle: string | null };
};

export function AdminPlansClient() {
  const [q, setQ] = useState("");
  const plansQuery = useQuery({
    queryKey: ["admin-plans", q],
    queryFn: () =>
      apiFetch<{ items: PlanItem[] }>(
        `/admin/plans?year=2026&q=${encodeURIComponent(q)}&page=1&pageSize=50`,
      ),
  });

  return (
    <AdminShell active="plans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Impact plans</h1>
          <p className="mt-1 text-sm text-muted">Create and manage staff plans for 2026.</p>
        </div>
        <Link
          href="/admin/plans/new"
          className="inline-flex h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white"
        >
          + New plan
        </Link>
      </div>
      <Card className="mt-6">
        <Input
          placeholder="Search by staff name or email"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        {plansQuery.isLoading ? (
          <StateView className="mt-4" state="loading" />
        ) : plansQuery.isError ? (
          <StateView className="mt-4" state="error" />
        ) : !plansQuery.data?.items.length ? (
          <StateView
            className="mt-4"
            state="empty"
            title="No plans yet"
            description="Create a plan for a staff member from Users or New plan."
          />
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Person</th>
                <th>Year</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {plansQuery.data.items.map((plan) => (
                <tr key={plan.id} className="border-t border-border">
                  <td className="py-3">
                    <p className="font-semibold text-navy">{plan.owner.fullName}</p>
                    <p className="text-muted">{plan.owner.jobTitle ?? plan.owner.email}</p>
                  </td>
                  <td>{plan.year}</td>
                  <td>
                    <Badge variant={plan.status === "FINALIZED" ? "success" : "accent"}>
                      {plan.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Link href={`/admin/plans/${plan.id}`} className="font-semibold text-accent">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
}
