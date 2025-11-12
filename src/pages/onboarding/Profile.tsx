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

  const expDesc: Record<string, string> = {
    novice:
      'You’re learning the basics. You focus on getting the movement right. You don’t really use concepts like RIR, RPE, myoreps, tempo work, or deloads yet. Progress mostly comes from just showing up and practicing the lifts.',
    intermediate:
      'You train consistently and understand the main ideas like RIR and RPE, progressive overload, and simple deloads. You follow a plan, track your lifts, and know how to push without overdoing it. You’re starting to use structured methods like tempo, supersets, or basic myoreps.',
    advanced:
      'You’ve been training seriously for years. You use RIR and RPE intentionally, plan overload across weeks, and schedule deloads based on fatigue. You understand myoreps, rest‑pause, tempo manipulation, periodization, and how to break through plateaus. Your technique is reliable across all compound lifts.',
    expert:
      'You have many years of lifting. You autoregulate volume and intensity, adjust periodization styles to your goals, and use advanced concepts intuitively. You know how to peak, rebuild, and stay strong year‑round. Your training is guided by experience, not guesswork.'
  };
  const fitDesc: Record<string, string> = {
    beginner:
      'You get tired easily during longer workouts or daily activities. Cardio feels tough, and recovery takes a while.',
    developing:
      'You can jog, cycle, or train steadily for 30–45 minutes. You’re starting to feel more comfortable with conditioning but still gas out on intense days.',
    trained:
      'You do endurance or mixed training a few times a week. You can stay active for about an hour without fading and recover well between sessions.',
    athletic:
      'You can train hard and long. Back‑to‑back workouts or long games don’t drain you much, and you bounce back quickly.',
    elite:
      'You have exceptional stamina and recovery. You can push at high intensity for long stretches and stay sharp across demanding training weeks.'
  };

  return (
    <div className="card p-4 grid gap-3">
      <h2 className="font-semibold">Your Profile</h2>
      <div className="text-sm text-muted">These details help the coach set appropriate volume, exercise selection, and how fast to progress week to week.</div>
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
        <label className="grid gap-1">
          <span className="text-sm">Lifting experience</span>
          <select className="input" value={(profile as any).liftingExperience || ''} onChange={(e) => setProfile({ ...profile, liftingExperience: (e.target.value || undefined) as any })}>
            <option value="">—</option>
            <option value="novice">Novice</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          {(profile as any).liftingExperience && (
            <div className="text-xs text-muted">{expDesc[((profile as any).liftingExperience as string) || '']}</div>
          )}
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Fitness level</span>
          <select className="input" value={(profile as any).fitnessLevel || ''} onChange={(e) => setProfile({ ...profile, fitnessLevel: (e.target.value || undefined) as any })}>
            <option value="">—</option>
            <option value="beginner">Beginner</option>
            <option value="developing">Developing</option>
            <option value="trained">Trained</option>
            <option value="athletic">Athletic</option>
            <option value="elite">Elite</option>
          </select>
          {(profile as any).fitnessLevel && (
            <div className="text-xs text-muted">{fitDesc[((profile as any).fitnessLevel as string) || '']}</div>
          )}
        </label>
      </div>
      <label className="grid gap-1 max-w-xs">
        <span className="text-sm">Units</span>
        <select className="input" value={settings.units} onChange={(e) => { settings.setUnits(e.target.value as any); setProfile({ ...profile, units: e.target.value as any }); }}>
          <option value="metric">metric</option>
          <option value="imperial">imperial</option>
        </select>
      </label>
      <div className="text-xs text-muted">What this affects: starting loads, weekly volume targets, exercise emphasis (main lifts vs. variations), and progression rate (load steps, deload frequency).</div>
      <div className="mt-2 flex gap-2">
        <button className="btn btn-primary" disabled={saving} onClick={async () => { setSaving(true); await saveProfile(profile); setSaving(false); nav('/onboarding/connect'); }}>{saving ? 'Saving…' : 'Continue'}</button>
        <button className="btn" onClick={() => nav('/onboarding/welcome')}>Back</button>
      </div>
    </div>
  );
}
