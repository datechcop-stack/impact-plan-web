import type { ObjectiveView } from "@/features/plan/objectives";
import { cn } from "@/lib/utils";

type EntryObjectivesViewProps = {
  objectives: ObjectiveView[];
  className?: string;
  compact?: boolean;
};

export function EntryObjectivesView({
  objectives,
  className,
  compact = false,
}: EntryObjectivesViewProps) {
  if (!objectives.length) {
    return <p className={cn("text-sm text-muted", className)}>No objectives yet.</p>;
  }

  return (
    <ul className={cn(compact ? "space-y-2" : "space-y-3", className)}>
      {objectives.map((objective, index) => (
        <li key={objective.id ?? index}>
          <p className={cn("text-sm text-navy", compact ? "font-medium" : "font-semibold")}>
            {objectives.length > 1 ? `${index + 1}. ` : null}
            {objective.text}
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted">
            {objective.successCriteria.map((criterion, criterionIndex) => (
              <li key={criterion.id ?? criterionIndex}>{criterion.text}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
