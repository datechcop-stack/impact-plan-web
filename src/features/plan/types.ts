import type { ObjectiveView } from "@/features/plan/objectives";

export type PlanEntry = {
  id: string;
  title: string;
  objectives: ObjectiveView[];
  dueDate: string;
  manager: { id: string; fullName: string };
  selfAssessment: {
    result: "ACHIEVED" | "PARTLY" | "NOT";
    resultText: string;
    evidenceUrl: string | null;
  } | null;
  pmReview: {
    score: number | null;
    comment: string | null;
    status: "DRAFT" | "REVIEWED";
    reviewer: { fullName: string };
  } | null;
};

export type PlanComponent = {
  id: string;
  type: "PROJECTS" | "BD" | "TECH_PERSONAL" | "COP";
  enabled: boolean;
  weight: number;
  lockState: "LOCKED" | "UNLOCKED";
  entries: PlanEntry[];
};

export type MyPlanResponse = {
  plan: {
    id: string;
    year: number;
    status:
      | "DRAFT"
      | "LOCKED"
      | "PARTLY_UNLOCKED"
      | "UNLOCKED"
      | "REVIEW_OPEN"
      | "IN_REVIEW"
      | "FINALIZED";
    submittedAt: string | null;
    lineManagerComment: string | null;
    recommendation: string | null;
    createdAt: string;
    owner: {
      id: string;
      fullName: string;
      jobTitle: string | null;
      lineManager: { id: string; fullName: string } | null;
    };
    createdBy: { fullName: string };
    components: PlanComponent[];
    changeLogs: Array<{
      id: string;
      action: string;
      createdAt: string;
      actor: { fullName: string };
    }>;
  } | null;
  reviewCycle: {
    windowOpens: string;
    selfAssessmentDeadline: string;
    purpose?: "MIDYEAR_PLAN_UPDATE" | "YEAR_END_REVIEW";
  } | null;
  score: {
    components: Array<{
      type: string;
      weight: number;
      score: number | null;
      points: number | null;
    }>;
    provisionalPoints: number;
    scoredWeightTotal: number;
    finalScore: number | null;
    isComplete: boolean;
  } | null;
};
