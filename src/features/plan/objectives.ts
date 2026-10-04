export type SuccessCriterionDraft = {
  text: string;
};

export type ObjectiveDraft = {
  text: string;
  successCriteria: SuccessCriterionDraft[];
};

export type SuccessCriterionView = {
  id?: string;
  text: string;
};

export type ObjectiveView = {
  id?: string;
  text: string;
  successCriteria: SuccessCriterionView[];
};

export function emptyObjective(): ObjectiveDraft {
  return { text: "", successCriteria: [{ text: "" }] };
}

export function emptyObjectives(): ObjectiveDraft[] {
  return [emptyObjective()];
}

export function toObjectiveDrafts(objectives: ObjectiveView[] | undefined): ObjectiveDraft[] {
  if (!objectives?.length) {
    return emptyObjectives();
  }
  return objectives.map((objective) => ({
    text: objective.text,
    successCriteria: objective.successCriteria.length
      ? objective.successCriteria.map((criterion) => ({ text: criterion.text }))
      : [{ text: "" }],
  }));
}
