export default function Strategy() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Strategy Coach</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 h-[60vh] overflow-auto">
          <h2 className="font-semibold mb-2">Coach</h2>
          <div className="text-sm text-muted">Chat thread will appear here. BYOK required for live AI.</div>
        </div>
        <div className="card p-4 h-[60vh] overflow-auto">
          <h2 className="font-semibold mb-2">Mesocycle Scaffold</h2>
          <div className="text-sm text-muted">Editable plan fields (cycle length, build:deload, weekly targets).</div>
        </div>
      </div>
    </div>
  );
}
