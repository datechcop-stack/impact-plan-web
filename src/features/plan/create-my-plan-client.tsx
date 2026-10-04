"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { UserPicker } from "@/components/ui/user-picker";
import { apiFetch, type PublicUser } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type ComponentType = "PROJECTS" | "BD" | "TECH_PERSONAL" | "COP";

type ComponentState = {
  type: ComponentType;
  enabled: boolean;
  weight: number;
  label: string;
  color: string;
};

const YEAR = 2026;

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

export function CreateMyPlanClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState(1);
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

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<PublicUser>("/auth/me"),
  });

  const total = useMemo(
    () => components.filter((c) => c.enabled).reduce((sum, c) => sum + c.weight, 0),
    [components],
  );

  const createMutation = useMutation({
    mutationFn: (lock: boolean) =>
      apiFetch("/me/plan", {
        method: "POST",
        json: {
          year: YEAR,
          components: components.map(({ type, enabled, weight }) => ({ type, enabled, weight })),
          entries,
          lock,
        },
      }),
    onSuccess: async (_data, lock) => {
      toast.success(
        lock ? "Plan created and locked" : "Draft plan created",
        lock
          ? "Your Impact Plan is locked. You can request edits later if needed."
          : "You can keep editing your draft from My Impact Plan.",
      );
      await queryClient.invalidateQueries({ queryKey: ["my-plan"] });
      router.push("/app/plan");
    },
    onError: (error) => {
      toast.error("Could not create plan", error.message);
    },
  });

  const user = meQuery.data;
  const canContinueStep1 = total === 100;

  if (meQuery.isLoading) {
    return (
      <AppShell active="plan">
        <StateView state="loading" title="Preparing your plan wizard…" />
      </AppShell>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <AppShell active="plan">
        <StateView
          state="error"
          title="Could not load your profile"
          description="Sign in again to create your Impact Plan."
          action={
            <Link href="/sign-in" className="font-semibold text-accent">
              Sign in
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
      <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-accent">CREATE PLAN</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        Create my Impact Plan · {YEAR}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {user.fullName}
        {user.jobTitle ? ` · ${user.jobTitle}` : ""}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["1 · Components & weights", "2 · Starting entries", "3 · Review"].map((label, index) => (
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
                Add starting entries for enabled components. You can leave this empty and add them
                later while the plan is a draft.
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
                <strong>Owner:</strong> {user.fullName}
              </p>
              <p>
                <strong>Weights total:</strong> {total}%
              </p>
              <p>
                <strong>Starting entries:</strong> {entries.length}
              </p>
              <p className="text-muted">
                Save as draft if you want to keep editing. Lock when you&apos;re ready for managers
                to see a final version — you can still request edits later.
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
                disabled={step === 1 && !canContinueStep1}
                onClick={() => setStep((value) => value + 1)}
              >
                {step === 1 ? "Next: starting entries" : "Next: review"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  size="full"
                  disabled={!canContinueStep1 || createMutation.isPending}
                  loading={createMutation.isPending && createMutation.variables === false}
                  loadingText="Creating…"
                  onClick={() => createMutation.mutate(false)}
                >
                  Save as draft
                </Button>
                <Button
                  variant="secondary"
                  size="full"
                  disabled={!canContinueStep1 || createMutation.isPending}
                  loading={createMutation.isPending && createMutation.variables === true}
                  loadingText="Locking…"
                  onClick={() => createMutation.mutate(true)}
                >
                  Create & lock
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
