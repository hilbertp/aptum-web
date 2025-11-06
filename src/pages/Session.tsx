import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { Session as SessionT } from '@/schemas/product';
import { listSessionsByDate } from '@/services/storage';

export default function Session() {
  const [session, setSession] = useState<SessionT | null>(null);
  const [status, setStatus] = useState<'idle'|'in_progress'|'aborted'|'completed'>('idle');
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
                <Section key={idx} block={b} />
              ))}
            </div>
          </div>
          <aside className="card p-4">
            <h2 className="font-semibold mb-2">Controls</h2>
            <div className="space-y-2">
              <button className="btn btn-primary w-full" onClick={()=>setStatus('in_progress')} disabled={status==='in_progress'}>Start Session</button>
              <button className="btn btn-outline w-full" onClick={()=>setStatus('aborted')}>Abort (Partial)</button>
            </div>
            <div className="text-xs text-muted mt-2">Status: {status}</div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ block }: { block: any }) {
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
          <ul className="list-disc pl-5 text-muted">
            {block.exercises.map((ex: any, i: number) => (
              <li key={i}>
                <span className="font-medium">{ex.id}</span> · {ex.sets} x {ex.reps ?? `${ex.timeSec}s`} · RIR {ex.rir}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
