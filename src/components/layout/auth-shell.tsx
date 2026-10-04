import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
};

export function AuthShell({
  eyebrow = "IMPACT PLAN",
  title,
  description,
  footer,
  children,
  className,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(300px,42%)_1fr]">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-navy px-8 py-10 text-white lg:px-12 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(47,111,237,0.35),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(91,163,224,0.28),transparent_40%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 bottom-20 h-40 w-40 rounded-full border border-white/10"
        />
        <div className="relative">
          <p className="text-xl font-extrabold tracking-tight">Dev-Afrique</p>
          <p className="mt-12 text-xs font-semibold tracking-[0.22em] text-white/65">{eyebrow}</p>
          <h1 className="mt-3 max-w-md text-3xl font-extrabold leading-tight tracking-tight lg:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 lg:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
        {footer ? <p className="relative text-xs leading-relaxed text-white/55">{footer}</p> : null}
      </aside>
      <main
        className={cn(
          "relative flex items-center justify-center bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3f9_100%)] px-6 py-10",
          className,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,111,237,0.08),transparent_40%)]"
        />
        <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-7 shadow-[0_20px_60px_-28px_rgba(11,42,74,0.35)] backdrop-blur sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
