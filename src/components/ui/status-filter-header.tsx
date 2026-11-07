"use client";

import { cn } from "@/lib/utils";

type StatusFilterHeaderProps<T extends string> = {
  label?: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
};

/** Table header cell for the Status column with an inline filter dropdown. */
export function StatusFilterHeader<T extends string>({
  label = "Status",
  value,
  options,
  onChange,
  className,
}: StatusFilterHeaderProps<T>) {
  const active = options[0]?.value !== value;
  return (
    <th className={className}>
      <label className="inline-flex items-center gap-1.5">
        <span>{label}</span>
        <select
          aria-label={`Filter by ${label.toLowerCase()}`}
          className={cn(
            "rounded-md border bg-white px-1.5 py-0.5 text-xs font-semibold normal-case",
            active ? "border-navy text-navy" : "border-border text-muted",
          )}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </th>
  );
}
