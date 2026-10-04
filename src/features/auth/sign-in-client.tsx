"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch, type PublicUser } from "@/lib/api/client";

function dashboardFor(user: PublicUser, next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return user.role === "ADMIN" ? "/admin" : "/app/plan";
}

export function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const passwordLogin = useMutation({
    mutationFn: () =>
      apiFetch<{ user: PublicUser }>("/auth/login", {
        method: "POST",
        json: { email, password },
      }),
    onSuccess: (data) => {
      toast.success("Signed in", `Welcome back, ${data.user.fullName.split(" ")[0]}.`);
      router.push(dashboardFor(data.user, next));
    },
    onError: (error) => {
      toast.error("Sign in failed", error.message);
    },
  });

  const requestOtp = useMutation({
    mutationFn: () =>
      apiFetch<{ sent: boolean; retryAfterSeconds: number; devCode?: string }>(
        "/auth/otp/request",
        {
          method: "POST",
          json: { email, purpose: "LOGIN" },
        },
      ),
    onSuccess: (data) => {
      setMode("otp");
      setOtpSent(true);
      if (data.devCode) {
        setCode(data.devCode);
      }
      toast.success("Code sent", "Check your inbox for a 6-digit code.");
    },
    onError: (error) => {
      toast.error("Could not send code", error.message);
    },
  });

  const verifyOtp = useMutation({
    mutationFn: () =>
      apiFetch<{ user: PublicUser }>("/auth/otp/verify", {
        method: "POST",
        json: { email, purpose: "LOGIN", code },
      }),
    onSuccess: (data) => {
      toast.success("Signed in", `Welcome back, ${data.user.fullName.split(" ")[0]}.`);
      router.push(dashboardFor(data.user, next));
    },
    onError: (error) => {
      toast.error("Verification failed", error.message);
    },
  });

  const submitting = passwordLogin.isPending || verifyOtp.isPending || requestOtp.isPending;

  return (
    <AuthShell
      title="Welcome back."
      description="Maximising quantifiable social impact, one plan at a time."
      footer="Accounts are created by invitation only."
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-accent">SIGN IN</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-navy">
        Sign in to Impact Plan
      </h2>
      <p className="mt-1.5 text-sm text-muted">Use your work email and preferred sign-in method.</p>
      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === "otp") {
            verifyOtp.mutate();
          } else {
            passwordLogin.mutate();
          }
        }}
      >
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@dev-afrique.com"
          />
        </div>
        {mode === "password" ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-accent transition-colors hover:text-navy"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            <p className="mt-1.5 text-xs text-muted">
              Shown only for people who chose a password at activation.
            </p>
          </div>
        ) : (
          <div>
            <Label>One-time code</Label>
            <OtpInput value={code} onChange={setCode} />
            {otpSent ? (
              <p className="mt-2 text-xs text-muted">Check your inbox for a 6-digit code.</p>
            ) : null}
          </div>
        )}
        <Button
          type="submit"
          size="full"
          loading={mode === "otp" ? verifyOtp.isPending : passwordLogin.isPending}
          loadingText={mode === "otp" ? "Verifying…" : "Signing in…"}
          disabled={!email || (mode === "password" ? !password : code.length !== 6)}
        >
          {mode === "otp" ? "Verify and continue" : "Sign in"}
        </Button>
        <div className="relative py-1 text-center text-xs text-muted">
          <span className="relative z-10 bg-white px-3">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
        </div>
        {mode === "password" ? (
          <Button
            type="button"
            variant="secondary"
            size="full"
            onClick={() => requestOtp.mutate()}
            loading={requestOtp.isPending}
            loadingText="Sending code…"
            disabled={!email || submitting}
          >
            Email me a one-time code
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="full"
            onClick={() => setMode("password")}
            disabled={submitting}
          >
            Use password instead
          </Button>
        )}
      </form>
    </AuthShell>
  );
}
