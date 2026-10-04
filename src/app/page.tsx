import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";

export default function HomePage() {
  return (
    <AuthShell
      title="Welcome back."
      description="Maximising quantifiable social impact, one plan at a time."
      footer="Accounts are created by invitation only."
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-accent">DEV-AFRIQUE</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-navy">Impact Plan</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Internal annual goal-setting and year-end review for Dev-Afrique.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/sign-in"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-navy text-sm font-semibold text-white shadow-sm shadow-navy/20 transition-all hover:bg-navy-soft hover:shadow-md"
        >
          Sign in
        </Link>
        <Link
          href="/admin"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold text-navy shadow-sm transition-all hover:border-navy/30 hover:bg-accent-soft"
        >
          Admin overview
        </Link>
      </div>
    </AuthShell>
  );
}
