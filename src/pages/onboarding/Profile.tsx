import { useState } from 'react';
import { useSettings } from '@/stores/settings';
import type { Profile as ProfileType } from '@/schemas/product';
import { saveProfile } from '@/services/coach';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const nav = useNavigate();
  const settings = useSettings();
  const [profile, setProfile] = useState<ProfileType>({ units: settings.units } as ProfileType);
  const [saving, setSaving] = useState(false);

  const toDisplayHeight = (cm?: number) => {
    if (!cm) return '' as any;
    return settings.units === 'imperial' ? Math.round((cm / 2.54) * 10) / 10 : cm;
  };
  const parseHeightInput = (val: string) => {
    const n = Number(val);
    if (!n) return undefined as any;
    return settings.units === 'imperial' ? Math.round(n * 2.54) : n; // store cm
  };
  const toDisplayWeight = (kg?: number) => {
    if (!kg) return '' as any;
    return settings.units === 'imperial' ? Math.round((kg * 2.2046226218) * 10) / 10 : kg;
  };
  const parseWeightInput = (val: string) => {
    const n = Number(val);
    if (!n) return undefined as any;
    return settings.units === 'imperial' ? Math.round((n / 2.2046226218) * 10) / 10 : n; // store kg
  };

  return (
    <div className="card p-4 grid gap-3">
      <h2 className="font-semibold">Your Profile</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Age</span>
          <input className="input" type="number" value={profile.ageYears ?? ''} onChange={(e) => setProfile({ ...profile, ageYears: Number(e.target.value) || undefined })} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Gender</span>
          <select className="input" value={profile.gender ?? ''} onChange={(e) => setProfile({ ...profile, gender: (e.target.value || null) as any })}>
            <option value="">—</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Height ({settings.units === 'metric' ? 'cm' : 'in'})</span>
          <input className="input" type="number" value={toDisplayHeight(profile.heightCm)} onChange={(e) => setProfile({ ...profile, heightCm: parseHeightInput(e.target.value) })} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Weight ({settings.units === 'metric' ? 'kg' : 'lb'})</span>
          <input className="input" type="number" value={toDisplayWeight(profile.weightKg)} onChange={(e) => setProfile({ ...profile, weightKg: parseWeightInput(e.target.value) })} />
        </label>
      </div>
      <label className="grid gap-1 max-w-xs">
        <span className="text-sm">Units</span>
        <select className="input" value={settings.units} onChange={(e) => { settings.setUnits(e.target.value as any); setProfile({ ...profile, units: e.target.value as any }); }}>
          <option value="metric">metric</option>
          <option value="imperial">imperial</option>
        </select>
      </label>
      <div className="mt-2 flex gap-2">
        <button className="btn btn-primary" disabled={saving} onClick={async () => { setSaving(true); await saveProfile(profile); setSaving(false); nav('/onboarding/goals'); }}>{saving ? 'Saving…' : 'Continue'}</button>
        <button className="btn" onClick={() => nav('/onboarding/connect')}>Back</button>
      </div>
    </div>
  );
}
