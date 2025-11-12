import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { signInWithGoogle } from '@/services/auth';
import { byok } from '@/services/byok';
import { saveProfile, generatePlanFromInterview } from '@/services/coach';
import type { Profile } from '@/schemas/product';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/stores/settings';

export default function Onboarding() {
  const auth = useAuth();
  const nav = useNavigate();
  useEffect(() => {}, []);

  const existingKey = byok.get().apiKey || '';
  const [apiKey, setApiKey] = useState('');
  const mask = (k: string) => (k ? `${k.slice(0, 6)}…${k.slice(-4)}` : '');
  const [savingKey, setSavingKey] = useState(false);

  const [profile, setProfile] = useState<Profile>({ units: 'metric' } as Profile);
  const [savingProfile, setSavingProfile] = useState(false);

  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'fat loss' | 'endurance' | 'mixed'>('strength');
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState('full gym');
  const [constraints, setConstraints] = useState('');
  const [makingPlan, setMakingPlan] = useState(false);
  const [step, setStep] = useState(1);
  const total = 5;
  const settings = useSettings();
  const toDisplayHeight = (cm?: number) => {
    if (!cm) return '';
    return settings.units === 'imperial' ? Math.round((cm / 2.54) * 10) / 10 : cm;
  };
  const parseHeightInput = (val: string) => {
    const n = Number(val);
    if (!n) return undefined as number | undefined;
    return settings.units === 'imperial' ? Math.round(n * 2.54) : n; // store cm
  };
  const toDisplayWeight = (kg?: number) => {
    if (!kg) return '';
    return settings.units === 'imperial' ? Math.round((kg * 2.2046226218) * 10) / 10 : kg;
  };
  const parseWeightInput = (val: string) => {
    const n = Number(val);
    if (!n) return undefined as number | undefined;
    return settings.units === 'imperial' ? Math.round((n / 2.2046226218) * 10) / 10 : n; // store kg
  };

  return (
    <div className="grid gap-4">
      <div className="text-sm text-muted">Step {step} of {total}</div>

      {step === 1 && (
        <div className="card p-6">
          <div className="text-xs font-semibold text-aptum-blue">APTUM</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome to Aptum</h1>
          <p className="mt-2 text-muted">Your system for an intelligent life.</p>
          <p className="mt-4 text-muted">Here your health no longer depletes. Aptum learns your biology to align training, recovery, and nutrition with longevity.</p>
          <div className="mt-6 flex gap-2">
            <button className="btn btn-primary" onClick={() => setStep(2)}>Begin</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Google Sign-In</h2>
                <p className="text-sm text-muted">Required to set up your private Drive App Folder for data sync.</p>
              </div>
              {auth.status !== 'signed_in' ? (
                <button className="btn btn-primary" onClick={signInWithGoogle}>
                  {auth.status === 'signing_in' ? 'Signing in…' : 'Sign in with Google'}
                </button>
              ) : (
                <div className="text-sm text-aptum-blue">Connected</div>
              )}
            </div>
            {auth.status === 'error' && (
              <div className="mt-2 text-sm text-red-600">Google sign-in failed. Ensure VITE_GOOGLE_CLIENT_ID is set and this domain is allowed in your OAuth client.</div>
            )}
          </div>
          <div className="card p-4 grid gap-3">
            <h2 className="font-semibold">Your Profile</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm">Age</span>
                <input className="input" type="number" value={profile.ageYears ?? ''} onChange={e => setProfile({ ...profile, ageYears: Number(e.target.value) || undefined })} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Gender</span>
                <select className="input" value={profile.gender ?? ''} onChange={e => setProfile({ ...profile, gender: (e.target.value || null) as any })}>
                  <option value="">—</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Height ({settings.units === 'metric' ? 'cm' : 'in'})</span>
                <input className="input" type="number" value={toDisplayHeight(profile.heightCm) as any} onChange={e => setProfile({ ...profile, heightCm: parseHeightInput(e.target.value) })} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Weight ({settings.units === 'metric' ? 'kg' : 'lb'})</span>
                <input className="input" type="number" value={toDisplayWeight(profile.weightKg) as any} onChange={e => setProfile({ ...profile, weightKg: parseWeightInput(e.target.value) })} />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="text-sm">Units</span>
              <select className="input" value={settings.units} onChange={e => { settings.setUnits(e.target.value as any); setProfile({ ...profile, units: e.target.value as any }); }}>
                <option value="metric">metric</option>
                <option value="imperial">imperial</option>
              </select>
            </label>
            <div className="mt-3 flex gap-2">
              <button className="btn" disabled={savingProfile} onClick={async () => { setSavingProfile(true); await saveProfile(profile); setSavingProfile(false); setStep(3); }}>Continue</button>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="card p-4 grid gap-3">
          <h2 className="font-semibold">GPT‑5 Access</h2>
          <div className="text-sm text-muted">Paste your API key. It is stored only on this device.</div>
          <label className="grid gap-1">
            <span className="text-sm">API Key</span>
            <input className="input" type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
          </label>
          {existingKey && !apiKey && (<div className="text-xs text-muted">Saved: {mask(existingKey)}</div>)}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={savingKey} onClick={() => { setSavingKey(true); const k = (apiKey && apiKey.trim().length > 0) ? apiKey.trim() : existingKey; if (k) byok.set({ apiKey: k }); setSavingKey(false); setStep(4); }}>Continue</button>
            <button className="btn" onClick={() => setStep(2)}>Back</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card p-4 grid gap-3">
          <h2 className="font-semibold">Goals Interview</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <label className="grid gap-1">
              <span className="text-sm">Primary Goal</span>
              <select className="input" value={goal} onChange={e => setGoal(e.target.value as any)}>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="strength">Strength</option>
                <option value="fat loss">Fat loss</option>
                <option value="endurance">Endurance</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Days / week</span>
              <input className="input" type="number" min={2} max={7} value={days} onChange={e => setDays(Number(e.target.value) || 2)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Equipment</span>
              <input className="input" value={equipment} onChange={e => setEquipment(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-sm">Constraints / injuries (optional)</span>
            <input className="input" value={constraints} onChange={e => setConstraints(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={makingPlan} onClick={async () => {
              setMakingPlan(true);
              if (apiKey) byok.set({ apiKey });
              const plan = await generatePlanFromInterview(profile, { primaryGoal: goal, daysPerWeek: days, equipment, constraints });
              setMakingPlan(false);
              if (plan) setStep(5);
            }}>{makingPlan ? 'Generating…' : 'Generate Plan'}</button>
            <button className="btn" onClick={() => setStep(3)}>Back</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card p-4 grid gap-3">
          <h2 className="font-semibold">Mesocycle Overview</h2>
          <div className="text-sm text-muted">A draft plan has been generated. You can accept it now and edit details on the next screen.</div>
          <PlanPreviewAndAccept onAccepted={() => nav('/strategy')} />
          <div className="flex gap-2">
            <button className="btn" onClick={() => setStep(4)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect as _unused } from 'react';
import { strategy } from '@/services/strategy';
import { loadPlan } from '@/services/coach';
import { useState as _useState, useEffect as _useEffect } from 'react';

function PlanPreviewAndAccept({ onAccepted }: { onAccepted: () => void }) {
  const [plan, setPlan] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  useEffect(() => {
    (async () => {
      const p = await loadPlan();
      setPlan(p || null);
    })();
  }, []);
  if (!plan) return <div className="text-sm text-muted">Generating plan…</div>;
  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-line bg-panel p-3 text-sm overflow-auto max-h-64">
        <pre className="whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
      </div>
      <div>
        <button className="btn btn-primary" disabled={accepting} onClick={async () => {
          setAccepting(true);
          const p = await strategy.acceptPlan(plan);
          await import('@/services/storage').then(async (m) => { await m.put('plan', 'current', p); });
          setAccepting(false);
          onAccepted();
        }}>{accepting ? 'Accepting…' : 'Accept Plan'}</button>
      </div>
    </div>
  );
}
