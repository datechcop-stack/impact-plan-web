import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back."
      description="Maximising quantifiable social impact, one plan at a time."
      footer="Accounts are created by invitation only."
    >
      <h2 className="text-2xl font-extrabold text-navy">Sign in to Impact Plan</h2>
      <form className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@devafrique.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <a href="/forgot-password" className="text-sm font-semibold text-accent">
              Forgot password?
            </a>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" />
          <p className="mt-1 text-xs text-muted">
            Shown only for people who chose a password at activation.
          </p>
        </div>
        <Button type="submit" size="full">
          Sign in
        </Button>
        <div className="relative py-2 text-center text-xs text-muted">
          <span className="bg-white px-2">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
        </div>
        <Button type="button" variant="secondary" size="full">
          Email me a one-time code
        </Button>
      </form>
    </AuthShell>
  );
}
