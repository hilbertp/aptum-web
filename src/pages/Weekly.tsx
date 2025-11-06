import { useEffect, useState } from 'react';
import { format, startOfWeek } from 'date-fns';
import { exercise } from '@/services/exercise';
import { getCurrentPlan, getRecoverySnapshot, getSessionById, upsertSessionPreservingStatus } from '@/services/storage';
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
      // Merge statuses from existing store and upsert preserving status
      const withStatus = await Promise.all(sessions.map(async (s) => {
        const stored = await getSessionById<any>(s.sessionId);
        return stored?.status ? { ...s, status: stored.status } : s;
      }));
      setWeek(withStatus);
      await Promise.all(withStatus.map((s) => upsertSessionPreservingStatus(s)));
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
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={async()=>{ try { setStatus('Syncing…'); await syncUpload(); setStatus('Synced'); } catch { setStatus('Sync failed'); } }} disabled={!driveSync.hasToken}>Sync now</button>
          {status && <div className="text-sm text-muted">{status}</div>}
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {week?.map((s) => (
          <div key={s.sessionId} className="card p-4 relative">
            <div className="text-sm text-muted">{s.dateISO}</div>
            <div className="font-semibold">{s.focus} · {s.lengthMin} min</div>
            { (s as any)?.status && (
              <div className="absolute top-2 right-3 text-xs px-2 py-0.5 rounded border border-line bg-white">
                {(s as any).status === 'completed' ? 'Completed' : (s as any).status === 'in_progress' ? 'In progress' : (s as any).status === 'aborted' ? 'Aborted' : 'Planned'}
              </div>
            )}
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
