"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyObjective, type ObjectiveDraft } from "@/features/plan/objectives";

type EntryObjectivesEditorProps = {
  value: ObjectiveDraft[];
  onChange: (next: ObjectiveDraft[]) => void;
};

export function EntryObjectivesEditor({ value, onChange }: EntryObjectivesEditorProps) {
  return (
    <div className="space-y-4 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">Objectives & success criteria</p>
          <p className="mt-0.5 text-xs text-muted">
            Each objective can have multiple success criteria.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange([...value, emptyObjective()])}
        >
          + Add objective
        </Button>
      </div>

      {value.map((objective, objectiveIndex) => (
        <div
          key={objectiveIndex}
          className="rounded-xl border border-border/80 bg-background/60 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <Label htmlFor={`objective-${objectiveIndex}`}>Objective {objectiveIndex + 1}</Label>
            {value.length > 1 ? (
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 py-0 text-xs"
                onClick={() => onChange(value.filter((_, index) => index !== objectiveIndex))}
              >
                Remove objective
              </Button>
            ) : null}
          </div>
          <Textarea
            id={`objective-${objectiveIndex}`}
            className="mt-1.5"
            value={objective.text}
            placeholder="What should be achieved?"
            onChange={(event) => {
              const next = [...value];
              next[objectiveIndex] = { ...objective, text: event.target.value };
              onChange(next);
            }}
          />

          <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Success criteria
              </p>
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 py-0 text-xs"
                onClick={() => {
                  const next = [...value];
                  next[objectiveIndex] = {
                    ...objective,
                    successCriteria: [...objective.successCriteria, { text: "" }],
                  };
                  onChange(next);
                }}
              >
                + Add criterion
              </Button>
            </div>
            {objective.successCriteria.map((criterion, criterionIndex) => (
              <div key={criterionIndex}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Label htmlFor={`criterion-${objectiveIndex}-${criterionIndex}`}>
                    Criterion {criterionIndex + 1}
                  </Label>
                  {objective.successCriteria.length > 1 ? (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 py-0 text-xs"
                      onClick={() => {
                        const next = [...value];
                        next[objectiveIndex] = {
                          ...objective,
                          successCriteria: objective.successCriteria.filter(
                            (_, index) => index !== criterionIndex,
                          ),
                        };
                        onChange(next);
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  id={`criterion-${objectiveIndex}-${criterionIndex}`}
                  value={criterion.text}
                  placeholder="How will success be measured?"
                  onChange={(event) => {
                    const next = [...value];
                    const criteria = [...objective.successCriteria];
                    criteria[criterionIndex] = { text: event.target.value };
                    next[objectiveIndex] = { ...objective, successCriteria: criteria };
                    onChange(next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
