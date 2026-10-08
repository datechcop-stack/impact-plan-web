"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PencilLine,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";
import { signOut } from "@/lib/auth/sign-out";

type NavCounts = {
  projectsAwaiting: number;
  peopleCount: number;
  pendingEditRequests: number;
};

const adminNav = [
  {
    href: "/admin",
    label: "Overview",
    match: "overview" as const,
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users & invitations",
    match: "users" as const,
    icon: Users,
  },
  {
    href: "/admin/plans",
    label: "Impact plans",
    match: "plans" as const,
    icon: ClipboardList,
  },
  {
    href: "/admin/edit-requests",
    label: "Edit requests",
    match: "edit-requests" as const,
    icon: PencilLine,
  },
  {
    href: "/admin/review-cycle",
    label: "Review cycle",
    match: "review-cycle" as const,
    icon: CalendarRange,
  },
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
        <p className="text-lg font-extrabold tracking-tight">Dev-Afrique</p>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-white/55">
          IMPACT PLAN · ADMIN
        </p>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1.5" aria-label="Admin">
        {adminNav.map((item) => {
          const isActive = item.match === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white",
                isActive && "bg-white/12 text-white shadow-sm shadow-black/10",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 text-white/45 transition-colors group-hover:text-white/80",
                    isActive && "text-accent",
                  )}
                />
                {item.label}
              </span>
              {item.match === "edit-requests" && pendingEdits > 0 ? (
                <Badge variant="success">{pendingEdits}</Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void signOut();
        }}
        className="rounded-xl px-3 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        Sign out
      </button>
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
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy px-4 py-6 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(47,111,237,0.35),transparent_50%),radial-gradient(circle_at_80%_100%,rgba(91,163,224,0.2),transparent_45%)]"
        />
        <div className="relative flex h-full flex-col">
          <AdminNav active={active} pendingEdits={pendingEdits} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div>
            <p className="text-base font-extrabold text-navy">Dev-Afrique</p>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted">
              IMPACT PLAN · ADMIN
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-navy"
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
            <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col overflow-hidden bg-navy px-4 py-6 text-white shadow-xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(47,111,237,0.35),transparent_50%)]"
              />
              <div className="relative mb-2 flex justify-end">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative flex h-full flex-col">
                <AdminNav
                  active={active}
                  pendingEdits={pendingEdits}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
            </aside>
          </div>
        ) : null}

        <main className="relative flex-1 bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3f9_100%)] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_right,rgba(47,111,237,0.08),transparent_45%)]"
          />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
