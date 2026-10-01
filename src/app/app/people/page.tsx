import { AppShell } from "@/components/layout/app-shell";
import { StateView } from "@/components/ui/state-view";

export default function PeoplePage() {
  return (
    <AppShell active="people" userName="Tunde Bello">
      <h1 className="text-2xl font-extrabold text-navy">People I Manage</h1>
      <p className="mt-1 text-sm text-muted">Your direct reports and year-end progress.</p>
      <StateView
        className="mt-8"
        state="empty"
        title="No direct reports yet"
        description="Line-manager review UI lands in P6 (wireframes 13–14)."
      />
    </AppShell>
  );
}
