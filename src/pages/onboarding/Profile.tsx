import { useEffect, useState } from 'react';
import { getProfile, setProfile } from '@/services/storage';

type AthleteProfile = {
  name?: string;
  units?: 'metric' | 'imperial';
};

export default function Profile() {
  const [profile, setP] = useState<AthleteProfile>({ units: 'metric' });
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      const p = await getProfile<AthleteProfile>();
      setP({ units: 'metric', ...p });
    })();
  }, []);

  const save = async () => {
    await setProfile(profile);
    setStatus('Saved');
    setTimeout(()=>setStatus(''), 1200);
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Athlete Profile</h1>
      <div className="card p-4 max-w-md">
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-muted">Name</span>
            <input className="border rounded px-3 py-2" placeholder="Your name" value={profile.name || ''} onChange={(e)=>setP((p)=>({ ...p, name: e.target.value }))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-muted">Units</span>
            <select className="border rounded px-3 py-2" value={profile.units} onChange={(e)=>setP((p)=>({ ...p, units: (e.target.value as any) }))}>
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lb, in)</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" onClick={save}>Save</button>
            {status && <span className="text-xs text-muted">{status}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
