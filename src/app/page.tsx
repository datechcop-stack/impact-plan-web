import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";

export default function HomePage() {
  return (
    <AuthShell
      title="Welcome back."
      description="Maximising quantifiable social impact, one plan at a time."
      footer="Accounts are created by invitation only."
    >
      <h2 className="text-2xl font-extrabold text-navy">Impact Plan</h2>
      <p className="mt-2 text-sm text-muted">
        Internal annual goal-setting and year-end review for Dev-Afrique.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/sign-in"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy-soft"
        >
          Sign in
        </Link>
        <Link
          href="/admin"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-navy text-sm font-semibold text-navy hover:bg-accent-soft"
        >
          Admin overview (scaffold)
        </Link>
      </div>
    </AuthShell>
  );
}
