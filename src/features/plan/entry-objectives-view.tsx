import { FieldHeading, FormattedText } from "@/components/ui/formatted-text";
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
    <div className={cn(compact ? "space-y-3" : "space-y-4", className)}>
      {objectives.map((objective, index) => (
        <div key={objective.id ?? index} className="space-y-2">
          <div>
            <FieldHeading>
              {objectives.length > 1 ? `Objective ${index + 1}` : "Objective"}
            </FieldHeading>
            <FormattedText
              className={cn("mt-1 text-navy", compact ? "font-medium" : "font-semibold")}
              text={objective.text}
            />
          </div>
          <div>
            <FieldHeading>Success criteria</FieldHeading>
            {objective.successCriteria.length ? (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                {objective.successCriteria.map((criterion, criterionIndex) => (
                  <li key={criterion.id ?? criterionIndex}>
                    <FormattedText text={criterion.text} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">—</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
