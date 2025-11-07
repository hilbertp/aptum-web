import { useEffect, useState } from 'react';
import { getSettings, setSettings } from '@/services/storage';

export default function Plan() {
  const [weeks, setWeeks] = useState<number>(8);
  const [cap, setCap] = useState<number>(60);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      const s = await getSettings<any>();
      const d = s.onboardingDraft || {};
      setWeeks(Number(d.cycleWeeks ?? 8));
      setCap(Number(d.capMin ?? 60));
    })();
  }, []);

  const save = async () => {
    const s = await getSettings<any>();
    s.onboardingDraft = {
      ...(s.onboardingDraft || {}),
      cycleWeeks: weeks,
      capMin: cap
    };
    await setSettings(s);
    setStatus('Saved');
    setTimeout(()=>setStatus(''), 1200);
  };

  return (
    <div className="grid gap-4 max-w-xl">
      <h1 className="text-2xl font-bold">Mesocycle Planning</h1>
      <div className="card p-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-muted">Cycle length (weeks)</span>
          <input className="border rounded px-3 py-2" type="number" value={weeks} min={4} max={16} onChange={(e)=>setWeeks(Number(e.target.value))} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-muted">Default daily cap (minutes)</span>
          <input className="border rounded px-3 py-2" type="number" value={cap} min={20} max={120} onChange={(e)=>setCap(Number(e.target.value))} />
        </label>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" onClick={save}>Save</button>
          {status && <span className="text-xs text-muted">{status}</span>}
        </div>
      </div>
    </div>
  );
}
