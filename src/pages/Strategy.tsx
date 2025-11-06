import { useEffect, useState } from 'react';
import { orchestrator } from '@/services/orchestrator';
import { strategy } from '@/services/strategy';
import type { Plan } from '@/schemas/product';
import { getCurrentPlan, setCurrentPlan } from '@/services/storage';

export default function Strategy() {
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    getCurrentPlan<Plan>().then((p) => p && setPlan(p));
  }, []);

  const onPropose = async () => {
    const sc = await orchestrator.distillSC();
    const p = await strategy.proposePlan(sc);
    setPlan(p);
  };

  const onAccept = async () => {
    if (!plan) return;
    const accepted = await strategy.acceptPlan(plan);
    await setCurrentPlan(accepted);
    setPlan(accepted);
  };

  const update = (path: string, value: any) => {
    if (!plan) return;
    const next: any = { ...plan };
    if (path === 'cycle.weeks') next.cycle = { ...next.cycle, weeks: Number(value) };
    if (path === 'constraints.defaultDailyCapMin') next.constraints = { ...next.constraints, defaultDailyCapMin: Number(value) };
    setPlan(next);
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Strategy Coach</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 h-[60vh] overflow-auto">
          <h2 className="font-semibold mb-2">Coach</h2>
          <div className="text-sm text-muted">Chat thread will appear here. BYOK required for live AI.</div>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-outline" onClick={onPropose}>Propose Plan</button>
            <button className="btn btn-primary" onClick={onAccept} disabled={!plan}>Accept Plan</button>
          </div>
        </div>
        <div className="card p-4 h-[60vh] overflow-auto">
          <h2 className="font-semibold mb-2">Mesocycle Scaffold</h2>
          {plan ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm text-muted">Cycle weeks</label>
                <input className="border rounded px-2 py-1" type="number" value={(plan as any).cycle?.weeks || 8} onChange={(e)=>update('cycle.weeks', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm text-muted">Default daily cap (min)</label>
                <input className="border rounded px-2 py-1" type="number" value={(plan as any).constraints?.defaultDailyCapMin || 60} onChange={(e)=>update('constraints.defaultDailyCapMin', e.target.value)} />
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto">{JSON.stringify(plan, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-sm text-muted">No plan yet. Click Propose Plan to generate a starting point, then Accept Plan to set it as current.</div>
          )}
        </div>
      </div>
    </div>
  );
}
