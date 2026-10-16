"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ComponentType } from "@/lib/plan";

export type PlanComponentState = {
  type: ComponentType;
  enabled: boolean;
  weight: number;
  label: string;
  color: string;
};

export const PROGRAMME_COMPONENT_TEMPLATE: PlanComponentState[] = [
  { type: "PROJECTS", enabled: true, weight: 50, label: "Projects", color: "bg-projects" },
  { type: "BD", enabled: true, weight: 15, label: "Business Development", color: "bg-bd" },
  {
    type: "TECH_PERSONAL",
    enabled: true,
    weight: 25,
    label: "Technical / Personal Dev",
    color: "bg-tech",
  },
  { type: "COP", enabled: true, weight: 10, label: "Community of Practice", color: "bg-cop" },
];

const WEIGHT_PRESETS = {
  programme: [50, 15, 25, 10] as const,
  bdLead: [30, 50, 10, 10] as const,
};

type PlanComponentWeightsEditorProps = {
  components: PlanComponentState[];
  onChange: (components: PlanComponentState[]) => void;
};

export function PlanComponentWeightsEditor({
  components,
  onChange,
}: PlanComponentWeightsEditorProps) {
  const total = components.filter((c) => c.enabled).reduce((sum, c) => sum + c.weight, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(WEIGHT_PRESETS) as Array<keyof typeof WEIGHT_PRESETS>).map((key) => (
          <button
            key={key}
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:border-accent"
            onClick={() =>
              onChange(
                components.map((component, index) => ({
                  ...component,
                  weight: WEIGHT_PRESETS[key][index] ?? component.weight,
                  enabled: true,
                })),
              )
            }
          >
            {key === "programme" ? "Programme (50/15/25/10)" : "BD lead (30/50/10/10)"}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {components.map((component, index) => (
          <div key={component.type} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={component.enabled}
              onChange={(event) => {
                const next = [...components];
                next[index] = { ...component, enabled: event.target.checked };
                onChange(next);
              }}
            />
            <span className={cn("h-3 w-3 rounded-sm", component.color)} />
            <span className="flex-1 text-sm font-semibold text-navy">{component.label}</span>
            <Input
              className="w-20"
              type="number"
              min={0}
              max={100}
              value={component.weight}
              disabled={!component.enabled}
              onChange={(event) => {
                const next = [...components];
                next[index] = { ...component, weight: Number(event.target.value) };
                onChange(next);
              }}
            />
            <span className="text-sm text-muted">%</span>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "mt-4 rounded-xl px-3 py-2 text-sm font-semibold",
          total === 100 ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
        )}
      >
        {total === 100
          ? "Total 100%. Staff will use these sections when they create their plan."
          : `Total ${total}%. Must equal 100%.`}
      </div>
    </div>
  );
}
