import { useEffect, useState } from 'react';
import { getSettings, setSettings } from '@/services/storage';

export default function Goals() {
  const [strength, setStrength] = useState<number>(2);
  const [conditioning, setConditioning] = useState<number>(3);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      const s = await getSettings<any>();
      const draft = s.onboardingDraft || {};
      if (draft.priorities) {
        setStrength(Number(draft.priorities.strength ?? 2));
        setConditioning(Number(draft.priorities.conditioning ?? 3));
      }
    })();
  }, []);

  const save = async () => {
    const s = await getSettings<any>();
    s.onboardingDraft = {
      ...(s.onboardingDraft || {}),
      priorities: { strength, conditioning }
    };
    await setSettings(s);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1200);
  };

  return (
    <div className="grid gap-4 max-w-xl">
      <h1 className="text-2xl font-bold">Goals Interview</h1>
      <p className="text-sm text-muted">Tell us where to focus this cycle. You can change this later.</p>
      <label className="grid gap-1">
        <span className="text-sm text-muted">Strength focus (1-5)</span>
        <input type="range" min={1} max={5} value={strength} onChange={(e)=>setStrength(Number(e.target.value))} />
        <div className="text-xs">Current: {strength}</div>
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-muted">Conditioning focus (1-5)</span>
        <input type="range" min={1} max={5} value={conditioning} onChange={(e)=>setConditioning(Number(e.target.value))} />
        <div className="text-xs">Current: {conditioning}</div>
      </label>
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={save}>Save</button>
        {status && <span className="text-xs text-muted">{status}</span>}
      </div>
    </div>
  );
}
