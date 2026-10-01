"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

type NavCounts = {
  projectsAwaiting: number;
  peopleCount: number;
  pendingEditRequests: number;
};

const staffNav = [
  { href: "/app/plan", label: "My Impact Plan", key: "plan" as const },
  { href: "/app/projects", label: "Projects I Manage", key: "projects" as const },
  { href: "/app/people", label: "People I Manage", key: "people" as const },
];

type AppShellProps = {
  active: "plan" | "projects" | "people";
  year?: number;
  userName?: string;
  children: ReactNode;
};

export function AppShell({ active, year = 2026, userName = "User", children }: AppShellProps) {
  const countsQuery = useQuery({
    queryKey: ["nav-counts"],
    queryFn: () => apiFetch<NavCounts>("/me/nav-counts"),
    staleTime: 30_000,
  });

  const counts = countsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
          <Link href="/app/plan" className="text-lg font-extrabold text-navy">
            Dev-Afrique
          </Link>
          <nav className="flex flex-1 items-center gap-6" aria-label="Primary">
            {staffNav.map((item) => {
              const isActive = item.key === active;
              const badge =
                item.key === "projects"
                  ? counts?.projectsAwaiting
                  : item.key === "people"
                    ? counts?.peopleCount
                    : undefined;
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
                  {badge != null && badge > 0 ? (
                    <Badge className="ml-2" variant="default">
                      {badge}
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
