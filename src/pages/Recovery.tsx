export default function Recovery() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Recovery & Progress</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Systemic Readiness</h2>
          <div className="text-sm text-muted">Manual inputs (RHR, HRV, Recovery Score) and computed readiness.</div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Per-Muscle Recovery</h2>
          <div className="text-sm text-muted">Heatmap placeholder.</div>
        </div>
        <div className="md:col-span-2 card p-4">
          <h2 className="font-semibold mb-2">Weekly Targets</h2>
          <div className="text-sm text-muted">Planned vs Completed vs Delta.</div>
        </div>
      </div>
    </div>
  );
}
