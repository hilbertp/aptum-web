import { useEffect, useState } from 'react';
import { getProfile, setProfile } from '@/services/storage';
import EnduranceSelect, { EnduranceSelection, EnduranceLevelKey } from '@/components/EnduranceSelect';

type AthleteProfile = {
  name?: string;
  units?: 'metric' | 'imperial';
  ageYears?: number;
  gender?: 'Male' | 'Female';
  heightCm?: number;
  weightKg?: number;
  liftingExperience?: string;
  endurance?: string;
};

export default function Profile() {
  const [profile, setP] = useState<AthleteProfile>({ units: 'metric' });
  const [status, setStatus] = useState<string>('');
  const [enduranceSel, setEnduranceSel] = useState<EnduranceSelection | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const p = await getProfile<AthleteProfile>();
      setP({ units: 'metric', ...p });
      if (p && (p as any).endurance) {
        const lvl = (p as any).endurance as EnduranceLevelKey;
        setEnduranceSel({ level: lvl, vo2Range: { male: [null, null], female: [null, null] } });
      }
    })();
  }, []);

  function toNumber(v: any) {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  const save = async () => {
    // Convert to metric for storage
    const units = profile.units || 'metric';
    let heightCm = toNumber(profile.heightCm);
    let weightKg = toNumber(profile.weightKg);
    if (units === 'imperial') {
      // If user entered inches and pounds, convert
      heightCm = heightCm !== undefined ? Math.round(heightCm * 2.54) : undefined;
      weightKg = weightKg !== undefined ? Math.round((weightKg * 0.453592) * 10) / 10 : undefined;
    }
    const cleaned: AthleteProfile = {
      ...profile,
      heightCm,
      weightKg
    };
    if (enduranceSel) {
      (cleaned as any).endurance = enduranceSel.level; // persist level string for now
      (cleaned as any).enduranceRange = enduranceSel.vo2Range;
    }
    await setProfile(cleaned);
    setStatus('Saved');
    setTimeout(()=>setStatus(''), 1200);
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Athlete Profile</h1>
      <div className="card p-4 max-w-md">
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-muted">Units</span>
            <select className="border rounded px-3 py-2" value={profile.units} onChange={(e)=>setP((p)=>({ ...p, units: (e.target.value as any) }))}>
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lb, in)</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-muted">Age</span>
            <input className="border rounded px-3 py-2" type="number" placeholder="30" value={profile.ageYears ?? ''} onChange={(e)=>setP((p)=>({ ...p, ageYears: toNumber(e.target.value) }))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-muted">Sex</span>
            <select className="border rounded px-3 py-2" value={profile.gender || ''} onChange={(e)=>setP((p)=>({ ...p, gender: (e.target.value || undefined) as any }))}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-muted">Height</span>
            <div className="relative">
              <input className="border rounded px-3 py-2 w-full" type="number" placeholder={profile.units==='imperial' ? '70' : '175'} value={profile.heightCm ?? ''} onChange={(e)=>setP((p)=>({ ...p, heightCm: toNumber(e.target.value) }))} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">{profile.units==='imperial' ? 'in' : 'cm'}</span>
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-muted">Weight</span>
            <div className="relative">
              <input className="border rounded px-3 py-2 w-full" type="number" placeholder={profile.units==='imperial' ? '165' : '70'} value={profile.weightKg ?? ''} onChange={(e)=>setP((p)=>({ ...p, weightKg: toNumber(e.target.value) }))} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">{profile.units==='imperial' ? 'lb' : 'kg'}</span>
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-muted">Lifting Experience</span>
            <select className="border rounded px-3 py-2" value={profile.liftingExperience || ''} onChange={(e)=>setP((p)=>({ ...p, liftingExperience: e.target.value || undefined }))}>
              <option value="">Select your level</option>
              <option>New to lifting</option>
              <option>1–2 years consistent</option>
              <option>3–5 years consistent</option>
              <option>5+ years trained athlete</option>
            </select>
          </label>
          <EnduranceSelect
            sex={(profile.gender === 'Female' ? 'female' : profile.gender === 'Male' ? 'male' : 'other')}
            value={enduranceSel}
            onChange={(sel)=>{ setEnduranceSel(sel); setP((p)=>({ ...p, endurance: sel.level } as any)); }}
          />
          <div className="rounded-xl bg-gray-100 p-3 text-sm text-ink/80">
            <strong className="block mb-1">VO₂max Information</strong>
            VO₂ max represents the maximum amount of oxygen an individual can utilize during intense, maximal exercise. It’s a key indicator of cardiorespiratory fitness.
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" onClick={save}>Save</button>
            {status && <span className="text-xs text-muted">{status}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
