import { Suspense } from "react";
import { CreatePlanWizardClient } from "@/features/admin/create-plan-wizard-client";
import { StateView } from "@/components/ui/state-view";

export default function NewPlanPage() {
  return (
    <Suspense fallback={<StateView state="loading" />}>
      <CreatePlanWizardClient />
    </Suspense>
  );
}
