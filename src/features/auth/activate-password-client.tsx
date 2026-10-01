"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateView } from "@/components/ui/state-view";
import { apiFetch, type PublicUser } from "@/lib/api/client";
import { isPasswordValid } from "@/lib/password";

type InviteInfo = { email: string };

export function ActivatePasswordClient({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const inviteQuery = useQuery({
    queryKey: ["invite", token],
    queryFn: () => apiFetch<InviteInfo>(`/auth/invite/${token}`),
  });

  const activateMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ user: PublicUser }>("/auth/activate/password", {
        method: "POST",
        json: { token, password, confirmPassword },
      }),
    onSuccess: (data) => {
      router.push(data.user.role === "ADMIN" ? "/admin" : "/app/plan");
    },
  });

  if (inviteQuery.isLoading) {
    return (
      <AuthShell title="Almost there." footer="Step 2 of 3">
        <StateView state="loading" />
      </AuthShell>
    );
  }

  if (!inviteQuery.data) {
    return (
      <AuthShell title="Almost there.">
        <StateView state="error" title="Invitation unavailable" />
      </AuthShell>
    );
  }

  const canSubmit =
    isPasswordValid(password) && password === confirmPassword && !activateMutation.isPending;

  return (
    <AuthShell
      title="Almost there."
      description="You'll use this password every time you sign in."
      footer="Step 2 of 3"
    >
      <Link href={`/activate/${token}`} className="text-sm font-semibold text-accent">
        ← Choose a different method
      </Link>
      <h2 className="mt-4 text-2xl font-extrabold text-navy">Set your password</h2>
      <p className="mt-1 text-sm text-muted">For {inviteQuery.data.email}</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          activateMutation.mutate();
        }}
      >
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
          <PasswordChecklist password={password} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" size="full" disabled={!canSubmit}>
          Activate account
        </Button>
        {activateMutation.isError ? (
          <p className="text-sm text-danger">{(activateMutation.error as Error).message}</p>
        ) : null}
      </form>
    </AuthShell>
  );
}
