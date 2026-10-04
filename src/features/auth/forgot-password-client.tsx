"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";
import { isPasswordValid } from "@/lib/password";

export function ForgotPasswordClient() {
  const toast = useToast();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const requestMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/auth/forgot-password/request", {
        method: "POST",
        json: { email },
      }),
    onSuccess: (data) => {
      toast.success("Code sent", data.message);
      setStep("reset");
    },
    onError: (error) => {
      toast.error("Request failed", error.message);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/auth/forgot-password/reset", {
        method: "POST",
        json: { email, code, password, confirmPassword },
      }),
    onSuccess: (data) => {
      toast.success("Password updated", data.message);
    },
    onError: (error) => {
      toast.error("Reset failed", error.message);
    },
  });

  return (
    <AuthShell
      title="Reset your password."
      description="We'll email a one-time code if the account exists."
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-accent">ACCOUNT</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-navy">Forgot password</h2>
      <p className="mt-1.5 text-sm text-muted">
        {step === "request"
          ? "Enter your work email to receive a reset code."
          : "Enter the code and choose a new password."}
      </p>
      {step === "request" ? (
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            requestMutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@dev-afrique.com"
            />
          </div>
          <Button
            type="submit"
            size="full"
            disabled={!email}
            loading={requestMutation.isPending}
            loadingText="Sending…"
          >
            Email me a code
          </Button>
        </form>
      ) : (
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            resetMutation.mutate();
          }}
        >
          <div>
            <Label>One-time code</Label>
            <OtpInput value={code} onChange={setCode} />
          </div>
          <div>
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Create a strong password"
            />
            <PasswordChecklist password={password} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput
              id="confirm"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Type it again"
            />
          </div>
          <Button
            type="submit"
            size="full"
            disabled={
              code.length !== 6 || !isPasswordValid(password) || password !== confirmPassword
            }
            loading={resetMutation.isPending}
            loadingText="Updating…"
          >
            Update password
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link
          href="/sign-in"
          className="font-semibold text-accent transition-colors hover:text-navy"
        >
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
