"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type UserOption = {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
};

type UserPickerProps = {
  value: string;
  onChange: (userId: string, user?: UserOption) => void;
  excludeUserId?: string;
  selectedLabel?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function UserPicker({
  value,
  onChange,
  excludeUserId,
  selectedLabel,
  placeholder = "Search people…",
  disabled,
  className,
}: UserPickerProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserOption | null>(null);

  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
  }, [value]);

  const lookupQuery = useQuery({
    queryKey: ["user-lookup", q],
    queryFn: () => apiFetch<UserOption[]>(`/users/lookup?q=${encodeURIComponent(q)}`),
    enabled: open || Boolean(value),
  });

  const matched = lookupQuery.data?.find((user) => user.id === value) ?? selected;
  const display =
    open || !value ? q : matched ? `${matched.fullName} · ${matched.email}` : (selectedLabel ?? q);

  const options = (lookupQuery.data ?? []).filter((user) => user.id !== excludeUserId);

  return (
    <div className={cn("relative", className)}>
      <Input
        value={display}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQ("");
        }}
        onChange={(event) => {
          setOpen(true);
          setQ(event.target.value);
        }}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && !disabled ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-white shadow-lg">
          {lookupQuery.isLoading ? (
            <p className="px-3 py-2 text-sm text-muted">Searching…</p>
          ) : options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">No matches</p>
          ) : (
            options.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent-soft"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSelected(user);
                  onChange(user.id, user);
                  setOpen(false);
                  setQ("");
                }}
              >
                <span className="text-sm font-semibold text-navy">{user.fullName}</span>
                <span className="text-xs text-muted">{user.jobTitle ?? user.email}</span>
              </button>
            ))
          )}
          {value ? (
            <button
              type="button"
              className="w-full border-t border-border px-3 py-2 text-left text-xs text-danger"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setSelected(null);
                onChange("");
                setOpen(false);
                setQ("");
              }}
            >
              Clear selection
            </button>
          ) : null}
          <button
            type="button"
            className="w-full border-t border-border px-3 py-2 text-left text-xs text-muted"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
