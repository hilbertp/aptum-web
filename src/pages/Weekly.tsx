import { useEffect, useState } from 'react';
import { format, startOfWeek } from 'date-fns';
import { exercise } from '@/services/exercise';
import { getCurrentPlan, getRecoverySnapshot, saveSession } from '@/services/storage';
import { recoveryService } from '@/services/recovery';
import { driveSync } from '@/services/driveSync';
import { syncUpload } from '@/services/sync';
import type { Plan, Recovery, Session } from '@/schemas/product';

export default function Weekly() {
  const [week, setWeek] = useState<Session[] | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      setStatus('Loading…');
      const p = await getCurrentPlan<Plan>();
      if (!p) { setPlan(null); setStatus('No accepted plan'); return; }
      setPlan(p);

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const startISO = format(weekStart, 'yyyy-MM-dd');

      const recSnap = await getRecoverySnapshot<any>(format(today, 'yyyy-MM-dd'));
      const readiness = recoveryService.computeSystemic({ score: recSnap?.systemic?.readiness });
      const recovery: Recovery = { systemic: { readiness } } as any;

      const capMin = p.constraints?.defaultDailyCapMin ?? 60;
      const sessions = await exercise.generateWeekAndValidate({ startISO, plan: p, recovery, capMin });
      setWeek(sessions);
      await Promise.all(sessions.map((s) => saveSession(s)));
      if (driveSync.hasToken) {
        try { setStatus('Syncing…'); await syncUpload(); setStatus('Synced'); } catch { setStatus('Sync failed'); }
      } else {
        setStatus('');
      }
    })();
  }, []);

  if (!plan) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Weekly Overview</h1>
        <div className="card p-4">
          <div className="text-sm text-muted">No accepted plan found. Go to Strategy to propose and accept a plan.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Overview</h1>
        {status && <div className="text-sm text-muted">{status}</div>}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {week?.map((s) => (
          <div key={s.sessionId} className="card p-4">
            <div className="text-sm text-muted">{s.dateISO}</div>
            <div className="font-semibold">{s.focus} · {s.lengthMin} min</div>
            <ul className="mt-2 text-sm list-disc pl-5">
              {s.blocks.slice(0,3).map((b: any, i: number) => (
                <li key={i}>{b.type}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
