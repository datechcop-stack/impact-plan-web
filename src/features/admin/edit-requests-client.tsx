"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type PendingItem = {
  id: string;
  scope: "WHOLE" | "COMPONENT";
  componentType: string | null;
  changeTypes: string[];
  reason: string;
  createdAt: string;
  requester: { fullName: string };
};

type UnlockedPlan = {
  id: string;
  owner: { fullName: string };
};

type ListResponse = {
  items: PendingItem[] | UnlockedPlan[];
};

export function EditRequestsClient() {
  const [tab, setTab] = useState<"pending" | "unlocked" | "history">("pending");
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["edit-requests", tab],
    queryFn: () => apiFetch<ListResponse>(`/admin/edit-requests?tab=${tab}`),
  });

  const pendingItems = (listQuery.data?.items ?? []).filter(
    (item): item is PendingItem => "requester" in item,
  );
  const unlockedItems = (listQuery.data?.items ?? []).filter(
    (item): item is UnlockedPlan => "owner" in item,
  );

  const declineMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/edit-requests/${id}/decline`, { method: "POST", json: {} }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["edit-requests"] }),
  });

  const unlockMutation = useMutation({
    mutationFn: ({ id, scope }: { id: string; scope: "whole" | "component" }) =>
      apiFetch(`/admin/edit-requests/${id}/unlock`, { method: "POST", json: { scope } }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["edit-requests"] }),
  });

  const relockMutation = useMutation({
    mutationFn: (planId: string) =>
      apiFetch(`/admin/plans/${planId}/relock`, { method: "POST", json: {} }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["edit-requests"] }),
  });

  return (
    <AdminShell active="edit-requests">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent">ADMIN</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        Edit requests
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Unlock the whole plan or just one component. Re-lock it when the person has saved.
      </p>
      <div className="mt-6 flex gap-2 rounded-2xl border border-border/80 bg-white p-1.5 shadow-sm shadow-navy/5">
        {(
          [
            ["pending", "Pending"],
            ["unlocked", "Currently unlocked"],
            ["history", "History"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
              tab === value
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:bg-accent-soft hover:text-navy",
            )}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <ListPageSkeleton className="mt-6" stats={0} rows={4} />
      ) : listQuery.isError ? (
        <StateView className="mt-6" state="error" />
      ) : !listQuery.data?.items.length ? (
        <StateView className="mt-6" state="empty" title="Nothing here" />
      ) : tab === "pending" ? (
        <div className="mt-6 space-y-4">
          {pendingItems.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-semibold text-navy">
                  {item.requester.fullName} asked to unlock{" "}
                  <Badge variant={item.scope === "WHOLE" ? "default" : "projects"}>
                    {item.scope === "WHOLE" ? "Whole plan" : item.componentType}
                  </Badge>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {item.changeTypes.join(", ")}. &ldquo;{item.reason}&rdquo;
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="link"
                  className="text-danger"
                  onClick={() => declineMutation.mutate(item.id)}
                >
                  Decline
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => unlockMutation.mutate({ id: item.id, scope: "whole" })}
                >
                  Unlock whole plan
                </Button>
                {item.scope === "COMPONENT" ? (
                  <Button
                    onClick={() => unlockMutation.mutate({ id: item.id, scope: "component" })}
                  >
                    Unlock component
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : tab === "unlocked" ? (
        <div className="mt-6 space-y-4">
          {unlockedItems.map((plan) => (
            <Card
              key={plan.id}
              className="flex items-center justify-between border-accent bg-accent-soft/40"
            >
              <p className="font-semibold text-navy">{plan.owner.fullName}</p>
              <Button onClick={() => relockMutation.mutate(plan.id)}>Re-lock plan</Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {pendingItems.map((item) => (
            <Card key={item.id}>
              <p className="font-semibold text-navy">{item.requester.fullName}</p>
              <p className="text-sm text-muted">
                {item.changeTypes.join(", ")} · {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
