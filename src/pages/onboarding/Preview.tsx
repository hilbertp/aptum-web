import { useEffect, useState } from 'react';
import { format, startOfWeek } from 'date-fns';
import { orchestrator } from '@/services/orchestrator';
import { strategy } from '@/services/strategy';
import { exercise } from '@/services/exercise';
import { getSettings, setSettings, setCurrentPlan, upsertSessionPreservingStatus, getSessionById } from '@/services/storage';
import type { Plan, Session } from '@/schemas/product';

export default function Preview() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [week, setWeek] = useState<Session[] | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      // Build a draft plan using orchestrator + user draft settings
      const sc = await orchestrator.distillSC();
      let p = await strategy.proposePlan(sc);
      const s = await getSettings<any>();
      const d = s.onboardingDraft || {};
      const startISO = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      p = {
        ...p,
        cycle: { weeks: Number(d.cycleWeeks ?? p.cycle.weeks), startISO },
        priorities: { strength: Number(d?.priorities?.strength ?? 2), conditioning: Number(d?.priorities?.conditioning ?? 3) },
        constraints: { ...(p.constraints||{}), defaultDailyCapMin: Number(d.capMin ?? 60) }
      } as Plan;
      setPlan(p);
      // Generate a preview week in-memory
      const rec: any = { systemic: { readiness: 80 } };
      const sessions = await exercise.generateWeekAndValidate({ startISO, plan: p, recovery: rec, capMin: p.constraints?.defaultDailyCapMin ?? 60 });
      setWeek(sessions);
    })();
  }, []);

  const accept = async () => {
    if (!plan) return;
    setStatus('Creating plan…');
    const accepted = await strategy.acceptPlan(plan);
    await setCurrentPlan(accepted);
    setStatus('Generating first week…');
    const startISO = plan.cycle.startISO;
    const rec: any = { systemic: { readiness: 80 } };
    const sessions = await exercise.generateWeekAndValidate({ startISO, plan: accepted, recovery: rec, capMin: accepted.constraints?.defaultDailyCapMin ?? 60 });
    const withStatus = await Promise.all(sessions.map(async (s) => {
      const stored = await getSessionById<any>(s.sessionId);
      return stored?.status ? { ...s, status: stored.status } : s;
    }));
    await Promise.all(withStatus.map((s) => upsertSessionPreservingStatus(s)));
    const s = await getSettings<any>();
    s.onboardingCompleted = true; await setSettings(s);
    setStatus('Done! Redirecting…');
    window.location.href = '/week';
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Session Preview</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Plan Summary</h2>
          {plan ? <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto">{JSON.stringify(plan, null, 2)}</pre> : <div className="text-sm text-muted">Preparing…</div>}
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">First Week (preview)</h2>
          {!week ? <div className="text-sm text-muted">Preparing…</div> : (
            <ul className="text-sm list-disc pl-5">
              {week.map((s)=> <li key={s.sessionId}>{s.dateISO}: {s.focus} · {s.lengthMin} min</li>)}
            </ul>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={accept} disabled={!plan}>Accept plan and create first week</button>
        {status && <span className="text-xs text-muted">{status}</span>}
      </div>
    </div>
  );
}
