"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { StateView } from "@/components/ui/state-view";
import { useToast } from "@/components/ui/toast";
import { apiFetch, type PublicUser } from "@/lib/api/client";

type InviteInfo = { email: string };

export function ActivateOtpClient({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const manualResendRef = useRef(false);

  const inviteQuery = useQuery({
    queryKey: ["invite", token],
    queryFn: () => apiFetch<InviteInfo>(`/auth/invite/${token}`),
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ sent: boolean; retryAfterSeconds: number; devCode?: string }>(
        "/auth/otp/request",
        {
          method: "POST",
          json: { token, purpose: "ACTIVATION" },
        },
      ),
    onSuccess: (data) => {
      setCooldown(data.retryAfterSeconds);
      if (data.devCode) {
        setCode(data.devCode);
      }
      if (manualResendRef.current) {
        toast.success("Code resent", "Check your inbox for a fresh 6-digit code.");
      }
    },
    onError: (error) => {
      toast.error("Could not send code", error.message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ user: PublicUser }>("/auth/otp/verify", {
        method: "POST",
        json: { token, purpose: "ACTIVATION", code },
      }),
    onSuccess: (data) => {
      toast.success("Account activated", "You're all set.");
      router.push(data.user.role === "ADMIN" ? "/admin" : "/app/plan");
    },
    onError: (error) => {
      toast.error("Verification failed", error.message);
    },
  });

  useEffect(() => {
    if (inviteQuery.isSuccess) {
      requestMutation.mutate();
    }
    // intentionally once when invite loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteQuery.isSuccess]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  if (inviteQuery.isLoading) {
    return (
      <AuthShell title="Check your inbox.">
        <StateView state="loading" />
      </AuthShell>
    );
  }

  if (!inviteQuery.data) {
    return (
      <AuthShell title="Check your inbox.">
        <StateView state="error" title="Invitation unavailable" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Check your inbox."
      description="A fresh code is emailed every time you sign in. Codes expire after 10 minutes."
      footer="Used at activation and every login"
    >
      <Link
        href={`/activate/${token}`}
        className="text-sm font-semibold text-accent transition-colors hover:text-navy"
      >
        ← Back
      </Link>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-navy">Enter your code</h2>
      <p className="mt-1 text-sm text-muted">
        We sent a 6-digit code to <strong>{inviteQuery.data.email}</strong>
      </p>
      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-navy">One-time code</p>
        <OtpInput value={code} onChange={setCode} />
      </div>
      <Button
        className="mt-6"
        size="full"
        disabled={code.length !== 6}
        loading={verifyMutation.isPending}
        loadingText="Verifying…"
        onClick={() => verifyMutation.mutate()}
      >
        Verify and continue
      </Button>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">Didn&apos;t get it? Check spam.</span>
        <button
          type="button"
          className="font-semibold text-accent transition-colors hover:text-navy disabled:text-muted"
          disabled={cooldown > 0 || requestMutation.isPending}
          onClick={() => {
            manualResendRef.current = true;
            requestMutation.mutate();
          }}
        >
          {requestMutation.isPending
            ? "Sending…"
            : cooldown > 0
              ? `Resend code (0:${String(cooldown).padStart(2, "0")})`
              : "Resend code"}
        </button>
      </div>
    </AuthShell>
  );
}
