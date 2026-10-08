"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { UserPicker } from "@/components/ui/user-picker";
import { EntryObjectivesEditor } from "@/features/plan/entry-objectives-editor";
import {
  emptyObjectives,
  toObjectiveDrafts,
  type ObjectiveDraft,
} from "@/features/plan/objectives";
import type { MyPlanResponse } from "@/features/plan/types";
import { apiFetch, type PublicUser } from "@/lib/api/client";
import { COMPONENT_META, type ComponentType } from "@/lib/plan";
import { cn } from "@/lib/utils";

type ComponentState = {
  type: ComponentType;
  enabled: boolean;
  weight: number;
  label: string;
  color: string;
};

const YEAR = 2026;

const componentTemplate: ComponentState[] = [
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

export function EditMyPlanClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [components, setComponents] = useState<ComponentState[]>(componentTemplate);
  const [entries, setEntries] = useState<
    Array<{
      type: ComponentType;
      title: string;
      objectives: ObjectiveDraft[];
      managerId: string;
      dueDate: string;
    }>
  >([]);
  const [hydrated, setHydrated] = useState(false);

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<PublicUser>("/auth/me"),
  });

  const planQuery = useQuery({
    queryKey: ["my-plan"],
    queryFn: () => apiFetch<MyPlanResponse>("/me/plan?year=2026"),
  });

  useEffect(() => {
    const plan = planQuery.data?.plan;
    if (!plan || hydrated) return;
    setComponents(
      componentTemplate.map((template) => {
        const saved = plan.components.find((c) => c.type === template.type);
        return saved
          ? { ...template, enabled: saved.enabled, weight: saved.weight }
          : { ...template, enabled: false, weight: 0 };
      }),
    );
    setEntries(
      plan.components
        .filter((c) => c.enabled)
        .flatMap((component) =>
          component.entries.map((entry) => ({
            type: component.type,
            title: entry.title,
            objectives: toObjectiveDrafts(entry.objectives),
            managerId: entry.manager.id,
            dueDate: entry.dueDate.slice(0, 10),
          })),
        ),
    );
    setHydrated(true);
  }, [planQuery.data?.plan, hydrated]);

  const total = useMemo(
    () => components.filter((c) => c.enabled).reduce((sum, c) => sum + c.weight, 0),
    [components],
  );

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      apiFetch("/me/plan", {
        method: "PATCH",
        json: {
          year: YEAR,
          components: components.map(({ type, enabled, weight }) => ({ type, enabled, weight })),
          entries: entries.map((entry) => ({
            type: entry.type,
            title: entry.title,
            objectives: entry.objectives,
            managerId: entry.managerId,
            dueDate: entry.dueDate,
          })),
        },
      }),
    onSuccess: async () => {
      toast.success(
        "Draft saved",
        "Your changes are saved. You can keep editing or lock the plan.",
      );
      await queryClient.invalidateQueries({ queryKey: ["my-plan"] });
      router.push("/app/plan");
    },
    onError: (error) => {
      toast.error("Could not save draft", error.message);
    },
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/me/plan", {
        method: "PATCH",
        json: {
          year: YEAR,
          components: components.map(({ type, enabled, weight }) => ({ type, enabled, weight })),
          entries: entries.map((entry) => ({
            type: entry.type,
            title: entry.title,
            objectives: entry.objectives,
            managerId: entry.managerId,
            dueDate: entry.dueDate,
          })),
        },
      });
      return apiFetch("/me/plan/lock", { method: "POST", json: { year: YEAR } });
    },
    onSuccess: async () => {
      toast.success(
        "Plan locked",
        "Tagged managers can now review your goals before the year-end review window opens.",
      );
      await queryClient.invalidateQueries({ queryKey: ["my-plan"] });
      router.push("/app/plan");
    },
    onError: (error) => {
      toast.error("Could not lock plan", error.message);
    },
  });

  const user = meQuery.data;
  const plan = planQuery.data?.plan;
  const canContinueStep1 = total === 100;

  if (meQuery.isLoading || planQuery.isLoading) {
    return (
      <AppShell active="plan">
        <PlanPageSkeleton />
      </AppShell>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <AppShell active="plan">
        <StateView state="error" title="Could not load your profile" />
      </AppShell>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <AppShell active="plan">
        <StateView state="empty" title="No draft to edit" description="Create a plan first." />
      </AppShell>
    );
  }

  if (plan.status !== "DRAFT") {
    return (
      <AppShell active="plan">
        <StateView
          state="empty"
          title="This plan is no longer a draft"
          description="Only draft plans can be edited here. Request edit access from the admin if the plan is locked."
          action={
            <Link href="/app/plan" className="font-semibold text-accent">
              Back to My Impact Plan
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell active="plan" userName={user.fullName}>
      <p className="text-sm">
        <Link href="/app/plan" className="font-semibold text-accent hover:text-navy">
          ← My Impact Plan
        </Link>
      </p>
      <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-accent">EDIT DRAFT</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        Edit my Impact Plan · {YEAR}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {user.fullName}
        {user.jobTitle ? ` · ${user.jobTitle}` : ""}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["1 · Components & weights", "2 · Entries", "3 · Review"].map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (index + 1 < step || (index === 1 && canContinueStep1) || index === 0) {
                setStep(index + 1);
              }
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
              step === index + 1
                ? "border-navy bg-navy text-white"
                : "border-border bg-white text-muted hover:border-navy/30 hover:text-navy",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          {step === 1 ? (
            <>
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
                  "mt-4 rounded-xl px-3 py-2 text-sm font-semibold",
                  total === 100 ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                )}
              >
                {total === 100
                  ? "Total 100%. Ready for the next step."
                  : `Total ${total}%. Must equal 100%.`}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-sm text-muted">
                Add entries by component so it is clear which part of your plan you are filling in.
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
                      objectives: emptyObjectives(),
                      managerId: "",
                      dueDate: `${YEAR}-12-31`,
                    },
                  ])
                }
              >
                + Add entry
              </Button>
              <div className="mt-4 space-y-4">
                {entries.map((entry, index) => (
                  <div key={index} className="rounded-xl border border-border p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Component</Label>
                        <select
                          className="h-12 w-full rounded-xl border border-border px-3 text-sm"
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
                      <EntryObjectivesEditor
                        value={entry.objectives}
                        onChange={(objectives) => {
                          const next = [...entries];
                          next[index] = { ...entry, objectives };
                          setEntries(next);
                        }}
                      />
                      <div className="md:col-span-2">
                        <Label>Tagged manager</Label>
                        <UserPicker
                          value={entry.managerId}
                          excludeUserId={user.id}
                          placeholder="Search for a manager…"
                          onChange={(managerId) => {
                            const next = [...entries];
                            next[index] = { ...entry, managerId };
                            setEntries(next);
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      className="mt-3"
                      variant="link"
                      onClick={() => setEntries((current) => current.filter((_, i) => i !== index))}
                    >
                      Remove entry
                    </Button>
                  </div>
                ))}
                {entries.length === 0 ? (
                  <StateView
                    state="empty"
                    size="compact"
                    title="No entries yet"
                    description="Use the component dropdown on each entry to show which area of your plan you are completing."
                  />
                ) : null}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Weights total:</strong> {total}%
              </p>
              <p>
                <strong>Entries:</strong> {entries.length}
              </p>
              <p className="text-muted">
                Save to keep editing later, or lock when you are ready. After you lock, each tagged
                manager reviews your goals before the plan is set for the year.
              </p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Component breakdown</CardTitle>
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
            <ul className="mt-4 space-y-1 text-xs text-muted">
              {(Object.keys(COMPONENT_META) as ComponentType[]).map((type) => {
                const count = entries.filter((e) => e.type === type).length;
                if (!components.find((c) => c.type === type)?.enabled) return null;
                return (
                  <li key={type}>
                    {COMPONENT_META[type].label}: {count} {count === 1 ? "entry" : "entries"}
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            {step < 3 ? (
              <Button
                size="full"
                disabled={step === 1 && !canContinueStep1}
                onClick={() => setStep((value) => value + 1)}
              >
                {step === 1 ? "Next: entries" : "Next: review"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  size="full"
                  disabled={
                    !canContinueStep1 || saveDraftMutation.isPending || lockMutation.isPending
                  }
                  loading={saveDraftMutation.isPending}
                  loadingText="Saving…"
                  onClick={() => saveDraftMutation.mutate()}
                >
                  Save draft
                </Button>
                <Button
                  variant="secondary"
                  size="full"
                  disabled={
                    !canContinueStep1 || saveDraftMutation.isPending || lockMutation.isPending
                  }
                  loading={lockMutation.isPending}
                  loadingText="Locking…"
                  onClick={() => lockMutation.mutate()}
                >
                  Lock plan for the year
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
