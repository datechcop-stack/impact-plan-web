import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Active staff", value: "—" },
  { label: "Plans created", value: "—" },
  { label: "Locked", value: "—" },
  { label: "In review", value: "—" },
  { label: "Finalized", value: "—" },
];

export default function AdminOverviewPage() {
  return (
    <AdminShell active="overview">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">2026 cycle overview</h1>
          <p className="mt-1 text-sm text-muted">Where every Impact Plan stands this year.</p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-navy">{stat.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Needs your attention</CardTitle>
          <p className="mt-2 text-sm text-muted">Admin workflows land in P3.</p>
        </Card>
        <Card>
          <CardTitle>Recent activity</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Change history feed wires up with edit requests.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
