import { useEffect, useState } from 'react';
import { exercise } from '@/services/exercise';
import type { Plan, Recovery, Session } from '@/schemas/product';

export default function Weekly() {
  const [week, setWeek] = useState<Session[] | null>(null);

  useEffect(() => {
    const plan: Plan = { version: 'p_dev', cycle: { weeks: 8, startISO: new Date().toISOString().slice(0,10) } } as any;
    const recovery: Recovery = { systemic: { readiness: 80 } } as any;
    const startISO = new Date().toISOString().slice(0,10);
    exercise.generateWeekAndValidate({ startISO, plan, recovery, capMin: 60 }).then(setWeek);
  }, []);

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Weekly Overview</h1>
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
