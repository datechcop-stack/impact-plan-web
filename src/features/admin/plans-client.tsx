"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { StatusFilterHeader } from "@/components/ui/status-filter-header";
import { useToast } from "@/components/ui/toast";
import { apiFetch, getErrorMessage } from "@/lib/api/client";
import { statusBadgeVariant, statusLabel, type PlanStatus } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { useState } from "react";

const PLAN_YEAR = 2026;

const PLAN_STATUS_FILTERS: Array<{ value: "ALL" | PlanStatus; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: statusLabel("DRAFT") },
  { value: "LOCKED", label: statusLabel("LOCKED") },
  { value: "PARTLY_UNLOCKED", label: statusLabel("PARTLY_UNLOCKED") },
  { value: "UNLOCKED", label: statusLabel("UNLOCKED") },
  { value: "REVIEW_OPEN", label: statusLabel("REVIEW_OPEN") },
  { value: "IN_REVIEW", label: statusLabel("IN_REVIEW") },
  { value: "FINALIZED", label: statusLabel("FINALIZED") },
];

type PlanItem = {
  id: string;
  year: number;
  status: PlanStatus;
  owner: { id: string; fullName: string; email: string; jobTitle: string | null };
};

type PlansResponse = {
  items: PlanItem[];
  counts?: { all: number; byStatus: Partial<Record<PlanStatus, number>> };
};

export function AdminPlansClient() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | PlanStatus>("ALL");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
    queryKey: ["admin-plans", q, status],
    queryFn: () => {
      const params = new URLSearchParams({
        year: String(PLAN_YEAR),
        q,
        page: "1",
        pageSize: "50",
      });
      if (status !== "ALL") {
        params.set("status", status);
      }
      return apiFetch<PlansResponse>(`/admin/plans?${params.toString()}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) =>
      apiFetch<{ ok: true }>(`/admin/plans/${planId}`, { method: "DELETE", json: {} }),
    onSuccess: async (_data, planId) => {
      const removed = plansQuery.data?.items.find((plan) => plan.id === planId);
      toast.success(
        "Plan deleted",
        removed
          ? `${removed.owner.fullName}'s ${removed.year} impact plan was permanently removed.`
          : "The impact plan was permanently removed.",
      );
      setConfirmDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (error) => {
      toast.error("Delete failed", getErrorMessage(error));
    },
  });

  const counts = plansQuery.data?.counts;
  const filterOptions = PLAN_STATUS_FILTERS.map((option) => {
    const count =
      option.value === "ALL"
        ? counts?.all
        : (counts?.byStatus[option.value] ?? (counts ? 0 : undefined));
    return {
      value: option.value,
      label: count == null ? option.label : `${option.label} · ${count}`,
    };
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
        <div className="mt-4 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold",
                status === option.value
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-white text-muted",
              )}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {plansQuery.isLoading ? (
          <TableSkeleton className="mt-4 border-0 p-0 shadow-none" rows={6} columns={4} />
        ) : plansQuery.isError ? (
          <StateView className="mt-4" state="error" />
        ) : !plansQuery.data?.items.length ? (
          <StateView
            className="mt-4"
            state="empty"
            title={status === "ALL" && !q ? "No plans yet" : "No plans match this filter"}
            description={
              status === "ALL" && !q
                ? "Create a plan for a staff member from Users or New plan."
                : "Try another status or clear the search."
            }
          />
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Person</th>
                <th>Year</th>
                <StatusFilterHeader value={status} options={filterOptions} onChange={setStatus} />
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
                    <Badge variant={statusBadgeVariant(plan.status)}>
                      {statusLabel(plan.status)}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Link href={`/admin/plans/${plan.id}`} className="font-semibold text-accent">
                        View
                      </Link>
                      {confirmDeleteId === plan.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            loading={
                              deleteMutation.isPending && deleteMutation.variables === plan.id
                            }
                            loadingText="Deleting…"
                            onClick={() => deleteMutation.mutate(plan.id)}
                          >
                            Confirm delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="link"
                          className="text-danger"
                          onClick={() => setConfirmDeleteId(plan.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
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
