import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { StateView } from "@/components/ui/state-view";

export default function PlanPage() {
  return (
    <AppShell active="plan" userName="Tunde Bello">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-navy">My Impact Plan 2026</h1>
            <Badge>Locked</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">Scaffold shell — plan data wires up in P4.</p>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <StateView
          state="empty"
          title="No plan loaded yet"
          description="Auth and plan APIs land in later phases. This route matches wireframe page 06."
        />
        <Card>
          <CardTitle>Component weights</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Projects, Business Development, Technical / Personal Dev, and Community of Practice.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
