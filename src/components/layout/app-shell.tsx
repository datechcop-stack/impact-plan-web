import type { ReactNode } from "react";
import Link from "next/link";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const staffNav = [
  { href: "/app/plan", label: "My Impact Plan" },
  { href: "/app/projects", label: "Projects I Manage", badge: 0 },
  { href: "/app/people", label: "People I Manage", badge: 0 },
] as const;

type AppShellProps = {
  active: "plan" | "projects" | "people";
  year?: number;
  userName?: string;
  children: ReactNode;
};

export function AppShell({ active, year = 2026, userName = "User", children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
          <Link href="/app/plan" className="text-lg font-extrabold text-navy">
            Dev-Afrique
          </Link>
          <nav className="flex flex-1 items-center gap-6" aria-label="Primary">
            {staffNav.map((item) => {
              const key = item.href.split("/").pop() as AppShellProps["active"];
              const isActive = key === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative pb-1 text-sm font-semibold text-muted hover:text-navy",
                    isActive &&
                      "text-navy after:absolute after:inset-x-0 after:-bottom-4 after:h-0.5 after:bg-accent",
                  )}
                >
                  {item.label}
                  {"badge" in item ? (
                    <Badge className="ml-2" variant="default">
                      {item.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <Badge variant="accent">{year} cycle</Badge>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white"
            aria-label={userName}
          >
            {initials(userName)}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
