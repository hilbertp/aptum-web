import { useEffect, useState } from 'react';
import { loadPlan } from '@/services/coach';
import type { Plan } from '@/schemas/product';
import { put } from '@/services/storage';

export default function Strategy() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await loadPlan();
      setPlan(p || null);
    })();
  }, []);

  if (!plan) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Strategy Coach</h1>
        <div className="card p-4 flex items-center justify-between">
          <div>No plan yet. Go to Onboarding → Generate Plan.</div>
          <a className="btn btn-primary" href="/onboarding">Open Onboarding</a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Strategy Coach</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 h-[60vh] overflow-auto">
          <h2 className="font-semibold mb-2">Plan</h2>
          <div className="grid gap-2">
            <label className="grid gap-1">
              <span className="text-sm">Weeks</span>
              <input className="input" type="number" value={plan.cycle.weeks} onChange={e => setPlan({ ...plan, cycle: { ...plan.cycle, weeks: Number(e.target.value) || plan.cycle.weeks } })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Start Date</span>
              <input className="input" type="date" value={plan.cycle.startISO} onChange={e => setPlan({ ...plan, cycle: { ...plan.cycle, startISO: e.target.value } })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Default Daily Cap (min)</span>
              <input className="input" type="number" value={plan.constraints?.defaultDailyCapMin ?? 60} onChange={e => setPlan({ ...plan, constraints: { ...(plan.constraints || {}), defaultDailyCapMin: Number(e.target.value) || 0 } })} />
            </label>
            <div className="flex gap-2">
              <button className="btn btn-primary" disabled={saving} onClick={async () => { setSaving(true); await put('plan', 'current', plan); setSaving(false); }}>Save</button>
            </div>
          </div>
        </div>
        <div className="card p-4 h-[60vh] overflow-auto">
          <h2 className="font-semibold mb-2">Sources</h2>
          {plan.sources?.length ? (
            <ul className="list-disc pl-5 text-sm">
              {plan.sources.map((s, i) => (
                <li key={i}><a className="text-aptum-blue" href={s.url} target="_blank" rel="noreferrer">{s.title || s.id}</a></li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted">No sources attached.</div>
          )}
        </div>
      </div>
    </div>
  );
}
