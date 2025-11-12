import { useLocation, useNavigate } from 'react-router-dom';
import { generatePlanFromInterview } from '@/services/coach';
import { byok } from '@/services/byok';
import { useEffect, useState } from 'react';

export default function Plan() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // noop
  }, []);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const plan = await generatePlanFromInterview({} as any, loc.state || {});
      if (plan) nav('/onboarding/preview');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 grid gap-3">
      <h2 className="font-semibold">Mesocycle Plan</h2>
      <p className="text-sm text-muted">We’ll generate a draft plan using your answers and our KB retriever. You can edit it later.</p>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={loading} onClick={handleGenerate}>{loading ? 'Generating…' : 'Generate Plan'}</button>
        <button className="btn" onClick={() => nav('/onboarding/goals')}>Back</button>
      </div>
    </div>
  );
}
