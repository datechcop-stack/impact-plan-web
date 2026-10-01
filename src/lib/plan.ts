export type ComponentType = "PROJECTS" | "BD" | "TECH_PERSONAL" | "COP";

export const COMPONENT_META: Record<
  ComponentType,
  {
    label: string;
    shortLabel: string;
    colorClass: string;
    badge: "projects" | "bd" | "tech" | "cop";
  }
> = {
  PROJECTS: {
    label: "Projects",
    shortLabel: "Projects",
    colorClass: "bg-projects",
    badge: "projects",
  },
  BD: {
    label: "Business Development",
    shortLabel: "Business Dev",
    colorClass: "bg-bd",
    badge: "bd",
  },
  TECH_PERSONAL: {
    label: "Technical / Personal Development",
    shortLabel: "Personal Dev",
    colorClass: "bg-tech",
    badge: "tech",
  },
  COP: {
    label: "Community of Practice",
    shortLabel: "CoP",
    colorClass: "bg-cop",
    badge: "cop",
  },
};

export type PlanStatus =
  "DRAFT" | "LOCKED" | "PARTLY_UNLOCKED" | "UNLOCKED" | "REVIEW_OPEN" | "IN_REVIEW" | "FINALIZED";

export function statusBadgeVariant(
  status: PlanStatus,
): "default" | "accent" | "success" | "warning" {
  switch (status) {
    case "FINALIZED":
      return "success";
    case "IN_REVIEW":
    case "REVIEW_OPEN":
      return "warning";
    case "PARTLY_UNLOCKED":
    case "UNLOCKED":
      return "accent";
    default:
      return "default";
  }
}

export function statusLabel(status: PlanStatus): string {
  switch (status) {
    case "PARTLY_UNLOCKED":
      return "Partly unlocked";
    case "REVIEW_OPEN":
      return "Review open";
    case "IN_REVIEW":
      return "In review";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");
  }
}

export function roundDisplay(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}
