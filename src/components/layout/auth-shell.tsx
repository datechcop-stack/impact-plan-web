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
    <div className="grid min-h-screen lg:grid-cols-[minmax(280px,38%)_1fr]">
      <aside className="flex flex-col justify-between bg-navy px-8 py-10 text-white">
        <div>
          <p className="text-lg font-bold tracking-wide">Dev-Afrique</p>
          <p className="mt-10 text-xs font-semibold tracking-[0.2em] text-white/70">{eyebrow}</p>
          <h1 className="mt-3 max-w-sm text-3xl font-extrabold leading-tight">{title}</h1>
          {description ? (
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">{description}</p>
          ) : null}
        </div>
        {footer ? <p className="text-xs text-white/60">{footer}</p> : null}
      </aside>
      <main className={cn("flex items-center justify-center bg-white px-6 py-10", className)}>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
