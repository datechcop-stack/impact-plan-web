"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

type NavCounts = {
  projectsAwaiting: number;
  peopleCount: number;
  pendingEditRequests: number;
};

const adminNav = [
  { href: "/admin", label: "Overview", match: "overview" as const },
  { href: "/admin/users", label: "Users & invitations", match: "users" as const },
  { href: "/admin/plans", label: "Impact plans", match: "plans" as const },
  { href: "/admin/edit-requests", label: "Edit requests", match: "edit-requests" as const },
  { href: "/admin/review-cycle", label: "Review cycle", match: "review-cycle" as const },
];

type AdminShellProps = {
  active: (typeof adminNav)[number]["match"];
  children: ReactNode;
};

function AdminNav({
  active,
  pendingEdits,
  onNavigate,
}: {
  active: AdminShellProps["active"];
  pendingEdits: number;
  onNavigate?: () => void;
}) {
  return (
    <>
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
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white",
                isActive && "bg-navy-soft text-white",
              )}
            >
              <span>{item.label}</span>
              {item.match === "edit-requests" && pendingEdits > 0 ? (
                <Badge variant="success">{pendingEdits}</Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/sign-in"
        onClick={onNavigate}
        className="px-3 py-2 text-sm text-white/70 hover:text-white"
      >
        Sign out
      </Link>
    </>
  );
}

export function AdminShell({ active, children }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const countsQuery = useQuery({
    queryKey: ["nav-counts"],
    queryFn: () => apiFetch<NavCounts>("/me/nav-counts"),
    staleTime: 30_000,
  });

  const pendingEdits = countsQuery.data?.pendingEditRequests ?? 0;

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
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col bg-navy px-4 py-6 text-white lg:flex">
        <AdminNav active={active} pendingEdits={pendingEdits} />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
          <div>
            <p className="text-base font-bold text-navy">Dev-Afrique</p>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted">
              IMPACT PLAN · ADMIN
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-navy"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-navy/40"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-navy px-4 py-6 text-white shadow-xl">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AdminNav
                active={active}
                pendingEdits={pendingEdits}
                onNavigate={() => setMenuOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <main className="flex-1 bg-background px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
