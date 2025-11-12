import { useEffect, useState } from 'react';
import { strategy } from '@/services/strategy';
import { loadPlan } from '@/services/coach';
import { useNavigate } from 'react-router-dom';

export default function Preview() {
  const nav = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await loadPlan();
      setPlan(p || null);
    })();
  }, []);

  if (!plan) return <div className="text-sm text-muted">Generating plan…</div>;

  return (
    <div className="grid gap-3">
      <div className="card p-3 text-sm overflow-auto max-h-64">
        <pre className="whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
      </div>
      <div>
        <button className="btn btn-primary" disabled={accepting} onClick={async () => {
          setAccepting(true);
          const p = await strategy.acceptPlan(plan);
          await import('@/services/storage').then(async (m) => { await m.put('plan', 'current', p); });
          setAccepting(false);
          nav('/strategy');
        }}>{accepting ? 'Accepting…' : 'Accept Plan'}</button>
      </div>
    </div>
  );
}
