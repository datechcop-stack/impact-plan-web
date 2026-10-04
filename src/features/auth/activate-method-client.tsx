"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type InviteInfo = {
  email: string;
  fullName: string;
  firstName: string;
  authMethod: string;
  lineManagerName: string | null;
  invitedByName: string;
};

export function ActivateMethodClient({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [method, setMethod] = useState<"PASSWORD" | "OTP">("PASSWORD");

  const inviteQuery = useQuery({
    queryKey: ["invite", token],
    queryFn: () => apiFetch<InviteInfo>(`/auth/invite/${token}`),
  });

  const chooseMutation = useMutation({
    mutationFn: () =>
      apiFetch("/auth/invite/choose-method", {
        method: "POST",
        json: { token, method },
      }),
    onSuccess: () => {
      toast.success("Method saved", "Continue to finish activating your account.");
      router.push(method === "PASSWORD" ? `/activate/${token}/password` : `/activate/${token}/otp`);
    },
    onError: (error) => {
      toast.error("Could not continue", error.message);
    },
  });

  if (inviteQuery.isLoading) {
    return (
      <AuthShell title="Set goals that add up to real impact." footer="Step 2 of 3">
        <StateView state="loading" title="Checking your invitation…" />
      </AuthShell>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <AuthShell title="Set goals that add up to real impact.">
        <StateView
          state="error"
          title="Invitation unavailable"
          description="This link is invalid or has expired. Ask your administrator to resend it."
        />
      </AuthShell>
    );
  }

  const invite = inviteQuery.data;

  return (
    <AuthShell
      title="Set goals that add up to real impact."
      description="Plan your year across Projects, Business Development, Personal Development and Communities of Practice, then review it together at year end."
      footer="1 Invitation accepted · 2 Choose how you sign in · 3 Go to your dashboard"
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-accent">ACTIVATION</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-navy">
        Welcome, {invite.firstName}
      </h2>
      <p className="mt-2 text-sm text-muted">
        Choose how you&apos;d like to sign in to Impact Plan. You only do this once.
      </p>
      <div className="mt-6">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" value={invite.email} readOnly disabled />
      </div>
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => setMethod("PASSWORD")}
          className={cn(
            "w-full rounded-2xl border p-4 text-left transition-all",
            method === "PASSWORD"
              ? "border-accent bg-accent-soft shadow-sm shadow-accent/10"
              : "border-border bg-white hover:border-navy/25",
          )}
        >
          <p className="font-bold text-navy">Set a password</p>
          <p className="mt-1 text-sm text-muted">
            Create a password now and use it every time you sign in.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMethod("OTP")}
          className={cn(
            "w-full rounded-2xl border p-4 text-left transition-all",
            method === "OTP"
              ? "border-accent bg-accent-soft shadow-sm shadow-accent/10"
              : "border-border bg-white hover:border-navy/25",
          )}
        >
          <p className="font-bold text-navy">Email me a one-time code</p>
          <p className="mt-1 text-sm text-muted">
            No password to remember. We&apos;ll email a new 6-digit code each time you sign in.
          </p>
        </button>
      </div>
      <Button
        className="mt-6"
        size="full"
        onClick={() => chooseMutation.mutate()}
        loading={chooseMutation.isPending}
        loadingText="Continuing…"
      >
        Continue
      </Button>
      <p className="mt-6 text-center text-xs text-muted">
        You can ask your administrator to switch methods later.{" "}
        <Link href="/sign-in" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
