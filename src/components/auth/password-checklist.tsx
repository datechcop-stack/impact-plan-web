"use client";

import { evaluatePassword, type PasswordRuleId } from "@/lib/password";
import { cn } from "@/lib/utils";

const labels: Record<PasswordRuleId, string> = {
  minLength: "At least 10 characters",
  number: "One number",
  symbol: "One symbol",
};

export function PasswordChecklist({ password }: { password: string }) {
  const result = evaluatePassword(password);
  return (
    <ul className="mt-2 space-y-1">
      {(Object.keys(labels) as PasswordRuleId[]).map((id) => {
        const ok = result[id];
        return (
          <li
            key={id}
            className={cn("flex items-center gap-2 text-sm", ok ? "text-success" : "text-muted")}
          >
            <span aria-hidden>{ok ? "✓" : "○"}</span>
            {labels[id]}
          </li>
        );
      })}
    </ul>
  );
}
