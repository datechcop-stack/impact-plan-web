"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateView } from "@/components/ui/state-view";
import { UserPicker } from "@/components/ui/user-picker";
import { EntryObjectivesEditor } from "@/features/plan/entry-objectives-editor";
import { emptyObjectives, type ObjectiveDraft } from "@/features/plan/objectives";
import { COMPONENT_META, type ComponentType } from "@/lib/plan";
import { cn } from "@/lib/utils";

export type EntryDraft = {
  type: ComponentType;
  title: string;
  objectives: ObjectiveDraft[];
  managerId: string;
  dueDate: string;
};

type ComponentEntriesStepProps = {
  enabledTypes: ComponentType[];
  entries: EntryDraft[];
  onChange: (entries: EntryDraft[]) => void;
  ownerUserId: string;
  year: number;
  allowRemove?: boolean;
};

export function ComponentEntriesStep({
  enabledTypes,
  entries,
  onChange,
  ownerUserId,
  year,
  allowRemove = true,
}: ComponentEntriesStepProps) {
  const [activeType, setActiveType] = useState<ComponentType>(enabledTypes[0] ?? "PROJECTS");

  return (
    <div>
      <p className="text-sm text-muted">
        Choose a plan section, then add entries for that component. This keeps Projects, Business
        Development, Personal Development, and CoP clearly separated.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {enabledTypes.map((type) => {
          const count = entries.filter((e) => e.type === type).length;
          const meta = COMPONENT_META[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                activeType === type
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-white text-muted hover:border-navy/30 hover:text-navy",
              )}
            >
              <span className={cn("mr-2 inline-block h-2 w-2 rounded-sm", meta.colorClass)} />
              {meta.label}
              {count > 0 ? ` · ${count}` : ""}
            </button>
          );
        })}
      </div>

      <Button
        className="mt-4"
        variant="secondary"
        onClick={() =>
          onChange([
            ...entries,
            {
              type: activeType,
              title: "",
              objectives: emptyObjectives(),
              managerId: "",
              dueDate: `${year}-12-31`,
            },
          ])
        }
      >
        + Add {COMPONENT_META[activeType].label} entry
      </Button>

      <div className="mt-4 space-y-4">
        {entries.map((entry, index) => {
          if (entry.type !== activeType) return null;
          return (
            <div key={index} className="rounded-xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {COMPONENT_META[entry.type].label}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Entry title</Label>
                  <Input
                    value={entry.title}
                    onChange={(event) => {
                      const next = [...entries];
                      next[index] = { ...entry, title: event.target.value };
                      onChange(next);
                    }}
                  />
                </div>
                <EntryObjectivesEditor
                  value={entry.objectives}
                  onChange={(objectives) => {
                    const next = [...entries];
                    next[index] = { ...entry, objectives };
                    onChange(next);
                  }}
                />
                <div>
                  <Label>Tagged project manager</Label>
                  <UserPicker
                    value={entry.managerId}
                    excludeUserId={ownerUserId}
                    placeholder="Search for a manager…"
                    onChange={(managerId) => {
                      const next = [...entries];
                      next[index] = { ...entry, managerId };
                      onChange(next);
                    }}
                  />
                </div>
                <div>
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={entry.dueDate}
                    onChange={(event) => {
                      const next = [...entries];
                      next[index] = { ...entry, dueDate: event.target.value };
                      onChange(next);
                    }}
                  />
                </div>
              </div>
              {allowRemove ? (
                <Button
                  className="mt-3"
                  variant="link"
                  onClick={() => onChange(entries.filter((_, i) => i !== index))}
                >
                  Remove entry
                </Button>
              ) : null}
            </div>
          );
        })}
        {entries.every((entry) => entry.type !== activeType) ? (
          <StateView
            state="empty"
            size="compact"
            title={`No ${COMPONENT_META[activeType].shortLabel} entries yet`}
            description="Add an entry for this section of your plan."
          />
        ) : null}
      </div>
    </div>
  );
}
