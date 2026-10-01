"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateView } from "@/components/ui/state-view";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type ComponentType = "PROJECTS" | "BD" | "TECH_PERSONAL" | "COP";

type ComponentState = {
  type: ComponentType;
  enabled: boolean;
  weight: number;
  label: string;
  color: string;
};

const templates = {
  programme: [50, 15, 25, 10] as const,
  bdLead: [30, 50, 10, 10] as const,
};

const initialComponents: ComponentState[] = [
  { type: "PROJECTS", enabled: true, weight: 50, label: "Projects", color: "bg-projects" },
  { type: "BD", enabled: true, weight: 15, label: "Business Development", color: "bg-bd" },
  {
    type: "TECH_PERSONAL",
    enabled: true,
    weight: 25,
    label: "Technical / Personal Dev",
    color: "bg-tech",
  },
  { type: "COP", enabled: true, weight: 10, label: "Community of Practice", color: "bg-cop" },
];

type UserOption = { id: string; fullName: string; email: string; jobTitle: string | null };

export function CreatePlanWizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [ownerId, setOwnerId] = useState(searchParams.get("userId") ?? "");
  const [components, setComponents] = useState(initialComponents);
  const [entries, setEntries] = useState<
    Array<{
      type: ComponentType;
      title: string;
      objective: string;
      successCriteria: string;
      managerId: string;
      dueDate: string;
    }>
  >([]);

  const usersQuery = useQuery({
    queryKey: ["admin-users-for-plan"],
    queryFn: () => apiFetch<{ items: UserOption[] }>("/admin/users?page=1&pageSize=100"),
  });

  const total = useMemo(
    () => components.filter((c) => c.enabled).reduce((sum, c) => sum + c.weight, 0),
    [components],
  );

  const createMutation = useMutation({
    mutationFn: (lock: boolean) =>
      apiFetch("/admin/plans", {
        method: "POST",
        json: {
          ownerId,
          year: 2026,
          components: components.map(({ type, enabled, weight }) => ({ type, enabled, weight })),
          entries,
          lock,
        },
      }),
    onSuccess: () => router.push("/admin/plans"),
  });

  const owner = usersQuery.data?.items.find((user) => user.id === ownerId);

  return (
    <AdminShell active="plans">
      <p className="text-sm text-accent">
        <Link href="/admin/plans">Impact plans</Link> / New plan
      </p>
      <h1 className="mt-2 text-2xl font-extrabold text-navy">
        Create Impact Plan · {owner?.fullName ?? "Select staff"} · 2026
      </h1>
      <p className="mt-1 text-sm text-muted">
        {owner?.jobTitle ?? "Choose a staff member to begin."}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["1 · Components & weights", "2 · Starting entries", "3 · Review & lock"].map(
          (label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index + 1)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold",
                step === index + 1
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-white text-muted",
              )}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          {step === 1 ? (
            <>
              <div className="mb-4">
                <Label htmlFor="owner">Staff member</Label>
                <select
                  id="owner"
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={ownerId}
                  onChange={(event) => setOwnerId(event.target.value)}
                >
                  <option value="">Select…</option>
                  {usersQuery.data?.items
                    .filter((user) => user)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} · {user.email}
                      </option>
                    ))}
                </select>
              </div>
              <p className="text-sm text-muted">
                Turn on the components that apply and set their weights. Weights must total 100%.
              </p>
              <div className="mt-4 space-y-3">
                {components.map((component, index) => (
                  <div key={component.type} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={component.enabled}
                      onChange={(event) => {
                        const next = [...components];
                        next[index] = { ...component, enabled: event.target.checked };
                        setComponents(next);
                      }}
                    />
                    <span className={cn("h-3 w-3 rounded-sm", component.color)} />
                    <span className="flex-1 text-sm font-semibold text-navy">
                      {component.label}
                    </span>
                    <Input
                      className="w-20"
                      type="number"
                      min={0}
                      max={100}
                      value={component.weight}
                      disabled={!component.enabled}
                      onChange={(event) => {
                        const next = [...components];
                        next[index] = { ...component, weight: Number(event.target.value) };
                        setComponents(next);
                      }}
                    />
                    <span className="text-sm text-muted">%</span>
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  "mt-4 rounded-lg px-3 py-2 text-sm font-semibold",
                  total === 100 ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                )}
              >
                {total === 100
                  ? "Total 100%. Ready for the next step."
                  : `Total ${total}%. Must equal 100%.`}
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold text-navy">Copy from a template (optional)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setComponents((current) =>
                        current.map((item, index) => ({
                          ...item,
                          enabled: true,
                          weight: templates.programme[index]!,
                        })),
                      )
                    }
                  >
                    Programme staff · 50 / 15 / 25 / 10
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setComponents((current) =>
                        current.map((item, index) => ({
                          ...item,
                          enabled: true,
                          weight: templates.bdLead[index]!,
                        })),
                      )
                    }
                  >
                    BD lead · 30 / 50 / 10 / 10
                  </Button>
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-sm text-muted">
                Add starting entries for enabled components. You can leave components empty.
              </p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() =>
                  setEntries((current) => [
                    ...current,
                    {
                      type: components.find((c) => c.enabled)?.type ?? "PROJECTS",
                      title: "",
                      objective: "",
                      successCriteria: "",
                      managerId: "",
                      dueDate: "2026-12-31",
                    },
                  ])
                }
              >
                + Add entry
              </Button>
              <div className="mt-4 space-y-4">
                {entries.map((entry, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Component</Label>
                        <select
                          className="h-11 w-full rounded-lg border border-border px-3 text-sm"
                          value={entry.type}
                          onChange={(event) => {
                            const next = [...entries];
                            next[index] = {
                              ...entry,
                              type: event.target.value as ComponentType,
                            };
                            setEntries(next);
                          }}
                        >
                          {components
                            .filter((c) => c.enabled)
                            .map((c) => (
                              <option key={c.type} value={c.type}>
                                {c.label}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <Label>Due date</Label>
                        <Input
                          type="date"
                          value={entry.dueDate}
                          onChange={(event) => {
                            const next = [...entries];
                            next[index] = { ...entry, dueDate: event.target.value };
                            setEntries(next);
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Title</Label>
                        <Input
                          value={entry.title}
                          onChange={(event) => {
                            const next = [...entries];
                            next[index] = { ...entry, title: event.target.value };
                            setEntries(next);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Objective</Label>
                        <Input
                          value={entry.objective}
                          onChange={(event) => {
                            const next = [...entries];
                            next[index] = { ...entry, objective: event.target.value };
                            setEntries(next);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Success criteria</Label>
                        <Input
                          value={entry.successCriteria}
                          onChange={(event) => {
                            const next = [...entries];
                            next[index] = { ...entry, successCriteria: event.target.value };
                            setEntries(next);
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Tagged manager (user id for now)</Label>
                        <Input
                          value={entry.managerId}
                          onChange={(event) => {
                            const next = [...entries];
                            next[index] = { ...entry, managerId: event.target.value };
                            setEntries(next);
                          }}
                          placeholder="Select/paste manager user id"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {entries.length === 0 ? (
                  <StateView state="empty" title="No starting entries yet" />
                ) : null}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Owner:</strong> {owner?.fullName ?? "—"}
              </p>
              <p>
                <strong>Weights total:</strong> {total}%
              </p>
              <p>
                <strong>Starting entries:</strong> {entries.length}
              </p>
              <p className="text-muted">
                Create & lock makes the plan read-only for the owner. They can request edits through
                the app.
              </p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Plan preview</CardTitle>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full">
              {components
                .filter((c) => c.enabled)
                .map((c) => (
                  <div key={c.type} className={c.color} style={{ width: `${c.weight}%` }} />
                ))}
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {components
                .filter((c) => c.enabled)
                .map((c) => (
                  <li key={c.type} className="flex justify-between">
                    <span>{c.label}</span>
                    <span>{c.weight}%</span>
                  </li>
                ))}
            </ul>
          </Card>
          <Card>
            {step < 3 ? (
              <Button
                size="full"
                disabled={step === 1 && (total !== 100 || !ownerId)}
                onClick={() => setStep((value) => value + 1)}
              >
                {step === 1 ? "Next: starting entries" : "Next: review & lock"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  size="full"
                  disabled={!ownerId || total !== 100 || createMutation.isPending}
                  onClick={() => createMutation.mutate(true)}
                >
                  Create & lock
                </Button>
                <Button
                  variant="secondary"
                  size="full"
                  disabled={!ownerId || total !== 100 || createMutation.isPending}
                  onClick={() => createMutation.mutate(false)}
                >
                  Save as draft
                </Button>
              </div>
            )}
            {createMutation.isError ? (
              <p className="mt-2 text-sm text-danger">{(createMutation.error as Error).message}</p>
            ) : null}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
