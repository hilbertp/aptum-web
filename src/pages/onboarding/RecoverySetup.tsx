import { useNavigate } from 'react-router-dom';

export default function RecoverySetup() {
  const nav = useNavigate();
  return (
    <div className="card p-4 grid gap-3">
      <h2 className="font-semibold">Recovery Setup</h2>
      <p className="text-sm text-muted">Optional: connect recovery data sources (coming soon).</p>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => nav('/onboarding/preview')}>Skip</button>
        <button className="btn" onClick={() => nav('/onboarding/plan')}>Back</button>
      </div>
    </div>
  );
}
