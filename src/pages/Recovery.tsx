import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { recoveryService } from '@/services/recovery';
import { getRecoverySnapshot, saveRecoverySnapshot } from '@/services/storage';

export default function Recovery() {
  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const [rhrBpm, setRhrBpm] = useState<number | ''>('');
  const [hrvRmssdMs, setHrvRmssdMs] = useState<number | ''>('');
  const [score, setScore] = useState<number | ''>('');
  const [savedMsg, setSavedMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      const snap = await getRecoverySnapshot<any>(todayISO);
      if (snap) {
        setRhrBpm(snap.systemic?.rhrBpm ?? '');
        setHrvRmssdMs(snap.systemic?.hrvRmssdMs ?? '');
        setScore(snap.systemic?.readiness ?? '');
      }
    })();
  }, [todayISO]);

  const readiness = recoveryService.computeSystemic({ score: typeof score === 'number' ? score : undefined });

  const onSave = async () => {
    await saveRecoverySnapshot(todayISO, {
      systemic: {
        readiness,
        rhrBpm: typeof rhrBpm === 'number' ? rhrBpm : undefined,
        hrvRmssdMs: typeof hrvRmssdMs === 'number' ? hrvRmssdMs : undefined
      },
      inputs: { rhrBpm, hrvRmssdMs, score }
    });
    setSavedMsg('Saved');
    setTimeout(()=>setSavedMsg(''), 1500);
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Recovery & Progress</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Systemic Readiness</h2>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-muted">RHR (bpm)</label>
              <input className="border rounded px-2 py-1" type="number" value={rhrBpm} onChange={(e)=>setRhrBpm(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-muted">HRV RMSSD (ms)</label>
              <input className="border rounded px-2 py-1" type="number" value={hrvRmssdMs} onChange={(e)=>setHrvRmssdMs(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-muted">Recovery Score (0-100)</label>
              <input className="border rounded px-2 py-1" type="number" value={score} onChange={(e)=>setScore(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-muted">Computed Readiness</label>
              <div className="font-semibold">{readiness}</div>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-primary" onClick={onSave}>Save Today</button>
              {savedMsg && <div className="text-xs text-muted self-center">{savedMsg}</div>}
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Per-Muscle Recovery</h2>
          <div className="text-sm text-muted">Heatmap placeholder.</div>
        </div>
        <div className="md:col-span-2 card p-4">
          <h2 className="font-semibold mb-2">Weekly Targets</h2>
          <div className="text-sm text-muted">Planned vs Completed vs Delta.</div>
        </div>
      </div>
    </div>
  );
}
