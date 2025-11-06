import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { Session as SessionT } from '@/schemas/product';
import { listSessionsByDate } from '@/services/storage';
import { tracking } from '@/services/tracking';

export default function Session() {
  const [session, setSession] = useState<SessionT | null>(null);
  const [status, setStatus] = useState<'idle'|'in_progress'|'aborted'|'completed'>('idle');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    (async () => {
      const list = await listSessionsByDate<SessionT>(todayISO);
      setSession(list[0] || null);
    })();
  }, [todayISO]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today’s Session</h1>
        {session && <div className="text-sm text-muted">{session.dateISO} · {session.lengthMin} min</div>}
      </div>
      {!session ? (
        <div className="card p-4 text-sm text-muted">No session found for today. Generate the week from the Weekly page after accepting a plan.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 card p-4">
            <div className="space-y-4">
              {session.blocks.map((b: any, idx: number) => (
                <Section key={idx} block={b} sessionId={session.sessionId} progress={progress} onLog={async (exIdx: number, setIdx: number, payload: any)=>{
                  const ev = { eventId: crypto.randomUUID(), sessionId: session.sessionId, ex: exIdx, set: setIdx, ...payload, ts: Date.now() };
                  await tracking.logSet(ev);
                  setProgress((p)=>({ ...p, [`${exIdx}`]: setIdx }));
                }} />
              ))}
            </div>
          </div>
          <aside className="card p-4">
            <h2 className="font-semibold mb-2">Controls</h2>
            <div className="space-y-2">
              <button className="btn btn-primary w-full" onClick={()=>setStatus('in_progress')} disabled={status==='in_progress'}>Start Session</button>
              <button className="btn btn-outline w-full" onClick={()=>setStatus('aborted')}>Abort (Partial)</button>
              <button className="btn btn-outline w-full" onClick={()=>setStatus('completed')} disabled={status==='completed'}>Complete</button>
            </div>
            <div className="text-xs text-muted mt-2">Status: {status}</div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ block, sessionId, progress, onLog }: { block: any; sessionId?: string; progress: Record<string, number>; onLog: (exIdx: number, setIdx: number, payload: any) => Promise<void> }) {
  return (
    <div>
      <h2 className="font-semibold mb-1 capitalize">{block.type}</h2>
      <div className="text-sm">
        {block.items && (
          <ul className="list-disc pl-5 text-muted">
            {block.items.map((it: string, i: number) => <li key={i}>{it}</li>)}
          </ul>
        )}
        {block.exercises && (
          <ul className="pl-5 text-muted space-y-2">
            {block.exercises.map((ex: any, i: number) => {
              const done = progress[`${i}`] || 0;
              const total = ex.sets ?? 1;
              return (
                <li key={i} className="list-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{ex.id}</span> · {ex.sets} x {ex.reps ?? `${ex.timeSec}s`} · RIR {ex.rir}
                      <span className="ml-2 text-xs">({done}/{total})</span>
                    </div>
                    <button className="btn btn-xs btn-outline" disabled={done >= total} onClick={async ()=>{
                      const next = Math.min(done + 1, total);
                      await onLog(i, next, { reps: ex.reps, timeSec: ex.timeSec, rir: ex.rir });
                    }}>Log set</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
