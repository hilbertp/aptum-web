import { useEffect, useState } from 'react';
import type { Blocker, BlockerType } from '@/services/calendar';
import { listBlockers, saveBlocker } from '@/services/storage';

export default function Schedule() {
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [type, setType] = useState<BlockerType>('RecoveryDay');
  const [fatigue, setFatigue] = useState<'None'|'Low'|'Medium'|'High'>('Low');
  const [rrule, setRrule] = useState<string>('');

  useEffect(() => {
    listBlockers<Blocker>().then(setBlockers);
  }, []);

  const onAdd = async () => {
    const newBlocker: Blocker = {
      id: (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Date.now()),
      type,
      fatigue,
      rrule: rrule || undefined
    };
    await saveBlocker(newBlocker as any);
    const next = await listBlockers<Blocker>();
    setBlockers(next);
    setRrule('');
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Schedule</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Blockers</h2>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-muted">Type</label>
              <select className="border rounded px-2 py-1" value={type} onChange={(e)=>setType(e.target.value as BlockerType)}>
                <option>RecoveryDay</option>
                <option>GameDay</option>
                <option>TeamPractice</option>
                <option>Appointment</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-muted">Fatigue</label>
              <select className="border rounded px-2 py-1" value={fatigue} onChange={(e)=>setFatigue(e.target.value as any)}>
                <option>None</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-muted">RRULE (optional)</label>
              <input className="border rounded px-2 py-1" placeholder="FREQ=WEEKLY;BYDAY=MO" value={rrule} onChange={(e)=>setRrule(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-primary" onClick={onAdd}>Add Blocker</button>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Existing</h2>
          <ul className="text-sm list-disc pl-5">
            {blockers.map(b => (
              <li key={b.id}>
                <span className="font-medium">{b.type}</span> · fatigue {b.fatigue}{b.rrule ? ` · ${b.rrule}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
