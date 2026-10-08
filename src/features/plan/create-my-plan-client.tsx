"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { ComponentEntriesStep, type EntryDraft } from "@/features/plan/component-entries-step";
import { apiFetch, type PublicUser } from "@/lib/api/client";
import { COMPONENT_META, type ComponentType } from "@/lib/plan";

const YEAR = 2026;
const ENABLED_TYPES: ComponentType[] = ["PROJECTS", "BD", "TECH_PERSONAL", "COP"];

export function CreateMyPlanClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [entries, setEntries] = useState<EntryDraft[]>([]);

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<PublicUser>("/auth/me"),
  });

  const createMutation = useMutation({
    mutationFn: (lock: boolean) =>
      apiFetch("/me/plan", {
        method: "POST",
        json: {
          year: YEAR,
          entries,
          lock,
        },
      }),
    onSuccess: async (_data, lock) => {
      toast.success(
        lock ? "Plan created and locked" : "Draft saved",
        lock
          ? "Tagged managers can review your goals before the plan is set for the year."
          : "Continue editing from My Impact Plan whenever you are ready.",
      );
      await queryClient.invalidateQueries({ queryKey: ["my-plan"] });
      router.push("/app/plan");
    },
    onError: (error) => {
      toast.error("Could not create plan", error.message);
    },
  });

  const user = meQuery.data;

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
      <p className="mt-2 text-sm text-muted">
        Your administrator has already configured plan sections and weights. Focus on filling in
        goals for each component below.
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
              enabledTypes={ENABLED_TYPES}
              entries={entries}
              onChange={setEntries}
              ownerUserId={user.id}
              year={YEAR}
            />
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Owner:</strong> {user.fullName}
              </p>
              <p>
                <strong>Entries:</strong> {entries.length}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {ENABLED_TYPES.map((type) => {
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
                disabled={createMutation.isPending}
                loading={createMutation.isPending && createMutation.variables === false}
                loadingText="Saving…"
                onClick={() => createMutation.mutate(false)}
              >
                Save as draft
              </Button>
              <Button
                variant="secondary"
                size="full"
                disabled={createMutation.isPending}
                loading={createMutation.isPending && createMutation.variables === true}
                loadingText="Locking…"
                onClick={() => createMutation.mutate(true)}
              >
                Save & lock for manager review
              </Button>
            </div>
          )}
          <CardTitle className="mt-6">What happens next</CardTitle>
          <p className="mt-2 text-sm text-muted">
            After you lock, each tagged project manager reviews your objectives. Year-end scoring
            happens later in the review cycle.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
