import { AppShell } from "@/components/layout/app-shell";
import { StateView } from "@/components/ui/state-view";

export default function ProjectsPage() {
  return (
    <AppShell active="projects" userName="Tunde Bello">
      <h1 className="text-2xl font-extrabold text-navy">Projects I Manage</h1>
      <p className="mt-1 text-sm text-muted">
        Entries across all components where you are tagged as the Manager.
      </p>
      <StateView
        className="mt-8"
        state="empty"
        title="No tagged entries yet"
        description="PM scoring UI lands in P5 (wireframes 11–12)."
      />
    </AppShell>
  );
}
