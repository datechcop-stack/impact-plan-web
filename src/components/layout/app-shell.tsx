"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const countsQuery = useQuery({
    queryKey: ["nav-counts"],
    queryFn: () => apiFetch<NavCounts>("/me/nav-counts"),
    staleTime: 30_000,
  });

  const counts = countsQuery.data;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:gap-8 sm:px-6">
          <Link href="/app/plan" className="text-lg font-extrabold text-navy">
            Dev-Afrique
          </Link>
          <nav className="hidden flex-1 items-center gap-6 md:flex" aria-label="Primary">
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
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="accent" className="hidden sm:inline-flex">
              {year} cycle
            </Badge>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white"
              aria-label={userName}
            >
              {initials(userName)}
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-navy md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/30"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="absolute inset-x-0 top-18 mx-4 rounded-xl border border-border bg-white p-3 shadow-lg"
            aria-label="Primary"
          >
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
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-muted hover:bg-accent-soft hover:text-navy",
                    isActive && "bg-accent-soft text-navy",
                  )}
                >
                  <span>{item.label}</span>
                  {badge != null && badge > 0 ? <Badge variant="default">{badge}</Badge> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
