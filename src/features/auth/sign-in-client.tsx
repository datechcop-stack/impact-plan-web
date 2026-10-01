"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { apiFetch, type PublicUser } from "@/lib/api/client";

const devShortcuts = process.env.NEXT_PUBLIC_DEV_SHORTCUTS === "true";

export function SignInClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const passwordLogin = useMutation({
    mutationFn: () =>
      apiFetch<{ user: PublicUser }>("/auth/login/password", {
        method: "POST",
        json: { email, password },
      }),
    onSuccess: (data) => {
      router.push(data.user.role === "ADMIN" ? "/admin" : "/app/plan");
    },
  });

  const requestOtp = useMutation({
    mutationFn: () =>
      apiFetch("/auth/otp/request", {
        method: "POST",
        json: { email, purpose: "LOGIN" },
      }),
    onSuccess: () => {
      setMode("otp");
      setOtpSent(true);
    },
  });

  const verifyOtp = useMutation({
    mutationFn: () =>
      apiFetch<{ user: PublicUser }>("/auth/otp/verify", {
        method: "POST",
        json: { email, purpose: "LOGIN", code },
      }),
    onSuccess: (data) => {
      router.push(data.user.role === "ADMIN" ? "/admin" : "/app/plan");
    },
  });

  const devAdmin = useMutation({
    mutationFn: () =>
      apiFetch<{ user: PublicUser }>("/auth/dev/login-admin", { method: "POST", json: {} }),
    onSuccess: () => router.push("/admin"),
  });

  return (
    <AuthShell
      title="Welcome back."
      description="Maximising quantifiable social impact, one plan at a time."
      footer="Accounts are created by invitation only."
    >
      <h2 className="text-2xl font-extrabold text-navy">Sign in to Impact Plan</h2>
      <form
        className="mt-8 space-y-4"
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
          />
        </div>
        {mode === "password" ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">
                Password
              </Label>
              <Link href="/forgot-password" className="text-sm font-semibold text-accent">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <p className="mt-1 text-xs text-muted">
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
        <Button type="submit" size="full">
          {mode === "otp" ? "Verify and continue" : "Sign in"}
        </Button>
        <div className="relative py-2 text-center text-xs text-muted">
          <span className="bg-white px-2">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
        </div>
        {mode === "password" ? (
          <Button
            type="button"
            variant="secondary"
            size="full"
            onClick={() => requestOtp.mutate()}
            disabled={!email || requestOtp.isPending}
          >
            Email me a one-time code
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="full" onClick={() => setMode("password")}>
            Use password instead
          </Button>
        )}
        {(passwordLogin.isError || verifyOtp.isError || requestOtp.isError) && (
          <p className="text-sm text-danger">
            {(passwordLogin.error || verifyOtp.error || requestOtp.error)?.message}
          </p>
        )}
      </form>
      {devShortcuts ? (
        <div className="mt-8 flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
          <span className="text-muted">Prototype shortcut</span>
          <button
            type="button"
            className="font-semibold text-accent"
            onClick={() => devAdmin.mutate()}
          >
            Sign in as Admin →
          </button>
        </div>
      ) : null}
    </AuthShell>
  );
}
