"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { COMPONENT_META, type ComponentType } from "@/lib/plan";
import { cn } from "@/lib/utils";

const CHANGE_TYPES = [
  { id: "ADD_ENTRY", label: "Add an entry" },
  { id: "EDIT_OBJECTIVE_CRITERIA", label: "Edit objective / success criteria" },
  { id: "CHANGE_MANAGER", label: "Change tagged manager" },
  { id: "REMOVE_ENTRY", label: "Remove an entry" },
] as const;

type EditRequestModalProps = {
  open: boolean;
  onClose: () => void;
};

export function EditRequestModal({ open, onClose }: EditRequestModalProps) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"WHOLE" | "COMPONENT">("COMPONENT");
  const [componentType, setComponentType] = useState<ComponentType>("PROJECTS");
  const [changeTypes, setChangeTypes] = useState<string[]>(["ADD_ENTRY"]);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch("/me/plan/edit-requests", {
        method: "POST",
        json: {
          scope,
          componentType: scope === "COMPONENT" ? componentType : undefined,
          changeTypes,
          reason,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-plan"] });
      onClose();
    },
  });

  if (!open) return null;

  function toggleChange(id: string) {
    setChangeTypes((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-request-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-request-title" className="text-xl font-extrabold text-navy">
              Request edit access
            </h2>
            <p className="mt-1 text-sm text-muted">Your request goes to the Impact Plan admin.</p>
          </div>
          <button
            type="button"
            className="text-muted hover:text-navy"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-navy">What do you need to change?</p>
          <div className="mt-2 space-y-2">
            <button
              type="button"
              className={cn(
                "w-full rounded-xl border p-3 text-left",
                scope === "WHOLE" ? "border-accent bg-accent-soft" : "border-border",
              )}
              onClick={() => setScope("WHOLE")}
            >
              <p className="font-semibold text-navy">The whole plan</p>
              <p className="text-sm text-muted">Every component is unlocked.</p>
            </button>
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left",
                scope === "COMPONENT" ? "border-accent bg-accent-soft" : "border-border",
              )}
              onClick={() => setScope("COMPONENT")}
            >
              <div>
                <p className="font-semibold text-navy">One component</p>
                <p className="text-sm text-muted">Only the component you pick is unlocked.</p>
              </div>
              <select
                className="rounded-lg border border-border px-2 py-1 text-sm"
                value={componentType}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setComponentType(event.target.value as ComponentType)}
              >
                {(Object.keys(COMPONENT_META) as ComponentType[]).map((type) => (
                  <option key={type} value={type}>
                    {COMPONENT_META[type].shortLabel}
                  </option>
                ))}
              </select>
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-navy">Type of change</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANGE_TYPES.map((item) => {
              const selected = changeTypes.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-semibold",
                    selected
                      ? "border-accent bg-accent-soft text-navy"
                      : "border-border text-muted",
                  )}
                  onClick={() => toggleChange(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="reason">Reason</Label>
          <textarea
            id="reason"
            className="mt-1 min-h-24 w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={changeTypes.length === 0 || reason.trim().length < 5 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Send request
          </Button>
        </div>
        {mutation.isError ? (
          <p className="mt-3 text-sm text-danger">{(mutation.error as Error).message}</p>
        ) : null}
      </div>
    </div>
  );
}
