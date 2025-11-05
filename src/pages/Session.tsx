export default function Session() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Today’s Session</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card p-4">
          <div className="space-y-3">
            <Section title="Warm-up" />
            <Section title="Main Focus" />
            <Section title="Accessory" />
            <Section title="Cool-down" />
          </div>
        </div>
        <aside className="card p-4">
          <h2 className="font-semibold mb-2">Controls</h2>
          <div className="space-y-2">
            <button className="btn btn-primary w-full">Start Session</button>
            <button className="btn btn-outline w-full">Abort (Partial)</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div>
      <h2 className="font-semibold mb-1">{title}</h2>
      <div className="text-sm text-muted">—</div>
    </div>
  );
}
