"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";
import { useState } from "react";

const PLAN_YEAR = 2026;

type PlanItem = {
  id: string;
  year: number;
  status: string;
  owner: { id: string; fullName: string; email: string; jobTitle: string | null };
};

export function AdminPlansClient() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const exportMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ filename: string; csv: string }>(`/admin/plans/export?year=${PLAN_YEAR}`),
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export ready", `Downloaded ${data.filename}`);
    },
    onError: (error) => {
      toast.error("Export failed", error.message);
    },
  });
  const plansQuery = useQuery({
    queryKey: ["admin-plans", q],
    queryFn: () =>
      apiFetch<{ items: PlanItem[] }>(
        `/admin/plans?year=2026&q=${encodeURIComponent(q)}&page=1&pageSize=50`,
      ),
  });

  return (
    <AdminShell active="plans">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent">ADMIN</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Impact plans
          </h1>
          <p className="mt-1.5 text-sm text-muted">Create and manage staff plans for 2026.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={exportMutation.isPending}
            loading={exportMutation.isPending}
            loadingText="Exporting…"
            onClick={() => exportMutation.mutate()}
          >
            Download Excel (CSV)
          </Button>
          <Link
            href="/admin/plans/new"
            className="inline-flex h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-white shadow-sm shadow-navy/20 transition-all hover:bg-navy-soft"
          >
            + New plan
          </Link>
        </div>
      </div>
      <Card className="mt-6">
        <Input
          placeholder="Search by staff name or email"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        {plansQuery.isLoading ? (
          <TableSkeleton className="mt-4 border-0 p-0 shadow-none" rows={6} columns={4} />
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
