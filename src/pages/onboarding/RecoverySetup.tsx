import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { saveRecoverySnapshot } from '@/services/storage';

export default function RecoverySetup() {
  const [readiness, setReadiness] = useState<number>(80);
  const [rhr, setRhr] = useState<number | ''>('');
  const [hrv, setHrv] = useState<number | ''>('');
  const [status, setStatus] = useState('');

  const save = async () => {
    const todayISO = format(new Date(), 'yyyy-MM-dd');
    await saveRecoverySnapshot(todayISO, {
      systemic: { readiness, rhrBpm: rhr || undefined, hrvRmssdMs: hrv || undefined },
      inputs: { rhrBpm: rhr || undefined, hrvRmssdMs: hrv || undefined, source: 'onboarding' }
    });
    setStatus('Saved for today');
    setTimeout(()=>setStatus(''), 1200);
  };

  useEffect(() => {}, []);

  return (
    <div className="grid gap-4 max-w-xl">
      <h1 className="text-2xl font-bold">Recovery Setup</h1>
      <p className="text-sm text-muted">Optionally add an initial readiness snapshot. You can update it any day in Recovery.</p>
      <label className="grid gap-1">
        <span className="text-sm text-muted">Readiness (0-100)</span>
        <input type="range" min={0} max={100} value={readiness} onChange={(e)=>setReadiness(Number(e.target.value))} />
        <div className="text-xs">Current: {readiness}</div>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-muted">RHR (bpm)</span>
          <input className="border rounded px-3 py-2" type="number" value={rhr} onChange={(e)=>setRhr(e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-muted">HRV RMSSD (ms)</span>
          <input className="border rounded px-3 py-2" type="number" value={hrv} onChange={(e)=>setHrv(e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={save}>Save today</button>
        {status && <span className="text-xs text-muted">{status}</span>}
      </div>
    </div>
  );
}
