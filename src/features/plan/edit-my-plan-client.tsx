"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PlanPageSkeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { ComponentEntriesStep, type EntryDraft } from "@/features/plan/component-entries-step";
import { toObjectiveDrafts } from "@/features/plan/objectives";
import { prepareDraftEntries } from "@/features/plan/prepare-draft-entries";
import type { MyPlanResponse } from "@/features/plan/types";
import { apiFetch, type PublicUser } from "@/lib/api/client";
import { COMPONENT_META, type ComponentType } from "@/lib/plan";

const YEAR = 2026;

type CreateTemplateResponse = {
  components: Array<{ type: ComponentType; enabled: boolean; weight: number }>;
};

export function EditMyPlanClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [entries, setEntries] = useState<EntryDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<PublicUser>("/auth/me"),
  });

  const templateQuery = useQuery({
    queryKey: ["plan-create-template"],
    queryFn: () => apiFetch<CreateTemplateResponse>("/me/plan/create-template"),
  });

  const planQuery = useQuery({
    queryKey: ["my-plan"],
    queryFn: () => apiFetch<MyPlanResponse>("/me/plan?year=2026"),
  });

  const enabledTypes = useMemo(
    () =>
      templateQuery.data?.components.filter((c) => c.enabled).map((c) => c.type) ??
      (["PROJECTS", "BD", "TECH_PERSONAL", "COP"] as ComponentType[]),
    [templateQuery.data],
  );

  useEffect(() => {
    const plan = planQuery.data?.plan;
    if (!plan || hydrated) return;
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

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      apiFetch("/me/plan", {
        method: "PATCH",
        json: {
          year: YEAR,
          entries: prepareDraftEntries(entries, YEAR),
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
          entries: prepareDraftEntries(entries, YEAR),
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

  if (meQuery.isLoading || planQuery.isLoading || templateQuery.isLoading) {
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
      <p className="mt-2 text-sm text-muted">
        Continue filling in your plan entries. Section weights were set by your administrator.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["1 · Plan entries", "2 · Review & save"].map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (index === 0 || step === 2) setStep(index + 1);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              step === index + 1
                ? "border-navy bg-navy text-white"
                : "border-border bg-white text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          {step === 1 ? (
            <ComponentEntriesStep
              enabledTypes={enabledTypes}
              entries={entries}
              onChange={setEntries}
              ownerUserId={user.id}
              year={YEAR}
            />
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Entries:</strong> {entries.length}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {enabledTypes.map((type) => {
                  const count = entries.filter((e) => e.type === type).length;
                  return (
                    <li key={type}>
                      {COMPONENT_META[type].label}: {count}
                    </li>
                  );
                })}
              </ul>
              <p className="text-muted">
                Save as draft to keep editing. Lock when you are ready for tagged managers to review
                your goals for the year.
              </p>
            </div>
          )}
        </Card>

        <Card>
          {step < 2 ? (
            <Button size="full" onClick={() => setStep(2)}>
              Next: review & save
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                size="full"
                disabled={saveDraftMutation.isPending || lockMutation.isPending}
                loading={saveDraftMutation.isPending}
                loadingText="Saving…"
                onClick={() => saveDraftMutation.mutate()}
              >
                Save draft
              </Button>
              <Button
                variant="secondary"
                size="full"
                disabled={saveDraftMutation.isPending || lockMutation.isPending}
                loading={lockMutation.isPending}
                loadingText="Locking…"
                onClick={() => lockMutation.mutate()}
              >
                Save & lock for manager review
              </Button>
            </div>
          )}
          <CardTitle className="mt-6">Your plan sections</CardTitle>
          <ul className="mt-3 space-y-1 text-sm">
            {templateQuery.data?.components
              .filter((c) => c.enabled)
              .map((c) => (
                <li key={c.type} className="flex justify-between">
                  <span>{COMPONENT_META[c.type].label}</span>
                  <span>{c.weight}%</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
