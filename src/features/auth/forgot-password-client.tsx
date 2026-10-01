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
import { apiFetch } from "@/lib/api/client";
import { isPasswordValid } from "@/lib/password";

export function ForgotPasswordClient() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const requestMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/auth/forgot-password/request", {
        method: "POST",
        json: { email },
      }),
    onSuccess: (data) => {
      setMessage(data.message);
      setStep("reset");
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/auth/forgot-password/reset", {
        method: "POST",
        json: { email, code, password, confirmPassword },
      }),
    onSuccess: (data) => setMessage(data.message),
  });

  return (
    <AuthShell
      title="Reset your password."
      description="We'll email a one-time code if the account exists."
    >
      <h2 className="text-2xl font-extrabold text-navy">Forgot password</h2>
      {step === "request" ? (
        <form
          className="mt-6 space-y-4"
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
            />
          </div>
          <Button type="submit" size="full" disabled={!email || requestMutation.isPending}>
            Email me a code
          </Button>
        </form>
      ) : (
        <form
          className="mt-6 space-y-4"
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            />
          </div>
          <Button
            type="submit"
            size="full"
            disabled={
              code.length !== 6 ||
              !isPasswordValid(password) ||
              password !== confirmPassword ||
              resetMutation.isPending
            }
          >
            Update password
          </Button>
        </form>
      )}
      {message ? <p className="mt-4 text-sm text-success">{message}</p> : null}
      <p className="mt-6 text-sm">
        <Link href="/sign-in" className="font-semibold text-accent">
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
