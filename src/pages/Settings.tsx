export default function Settings() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold">Units</h2>
          <div className="text-sm text-muted">Metric / Imperial</div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">BYOK</h2>
          <div className="text-sm text-muted">Store your model API key locally (encrypted). Used for AI coach.</div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Export / Import</h2>
          <div className="text-sm text-muted">Download or restore your complete dataset (JSON zip).</div>
        </div>
      </div>
    </div>
  );
}
