import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const adminNav = [
  { href: "/admin", label: "Overview", match: "overview" },
  { href: "/admin/users", label: "Users & invitations", match: "users" },
  { href: "/admin/plans", label: "Impact plans", match: "plans" },
  { href: "/admin/edit-requests", label: "Edit requests", match: "edit-requests", badge: 0 },
  { href: "/admin/review-cycle", label: "Review cycle", match: "review-cycle" },
] as const;

type AdminShellProps = {
  active: (typeof adminNav)[number]["match"];
  children: ReactNode;
};

export function AdminShell({ active, children }: AdminShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-navy px-4 py-6 text-white">
        <div className="px-2">
          <p className="text-lg font-bold">Dev-Afrique</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-white/60">
            IMPACT PLAN · ADMIN
          </p>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Admin">
          {adminNav.map((item) => {
            const isActive = item.match === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white",
                  isActive && "bg-navy-soft text-white",
                )}
              >
                <span>{item.label}</span>
                {"badge" in item ? <Badge variant="success">{item.badge}</Badge> : null}
              </Link>
            );
          })}
        </nav>
        <Link href="/sign-in" className="px-3 py-2 text-sm text-white/70 hover:text-white">
          Sign out
        </Link>
      </aside>
      <main className="bg-background px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
