export default function Settings() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <AthleteProfileCard />
        <BYOKCard />
        <GoogleAccountCard />
        <ExportImportCard />
        <DriveSyncCard />
        <SyncPrefsCard />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { syncUpload, syncDownload, exportZip, importLocalZip } from '@/services/sync';
import { driveSync } from '@/services/driveSync';
import { getSettings, setSettings } from '@/services/storage';
import { getProfile, setProfile } from '@/services/storage';
import UnitToggle from '@/components/UnitToggle';
import InputWithUnit from '@/components/InputWithUnit';
import SelectBox from '@/components/SelectBox';
import { getAIKey, setAIKey, clearAIKey, getAIModel, setAIModel } from '@/services/byok';
import { chatJson } from '@/services/llm';
import { signInWithGoogle, signOutGoogle } from '@/services/auth';
import { useAuth } from '@/stores/auth';

function DriveSyncCard() {
  const [status, setStatus] = useState<string>('Idle');

  const onSync = async () => {
    try {
      setStatus('Syncing…');
      await syncUpload();
      setStatus('Synced to Drive');
    } catch (e:any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const onRestore = async () => {
    try {
      setStatus('Downloading…');
      const blob = await syncDownload();
      if (!blob) { setStatus('No backup on Drive'); return; }
      // For MVP: just trigger a download of the decrypted zip
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'aptum_export.zip'; a.click();
      URL.revokeObjectURL(url);
      setStatus('Downloaded');
    } catch (e:any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="font-semibold">Drive Sync</h2>
      <div className="text-sm text-muted mb-2">Encrypted bundle in your Google Drive App Folder. Requires Google Sign-In.</div>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={onSync} disabled={!driveSync.hasToken}>Sync to Drive</button>
        <button className="btn btn-outline" onClick={onRestore} disabled={!driveSync.hasToken}>Restore</button>
      </div>
      <div className="text-xs text-muted mt-2">{status}</div>
    </div>
  );
}

function BYOKCard() {
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [status, setStatus] = useState('');
  useEffect(() => {
    setKey(getAIKey() || '');
    setModel(getAIModel());
  }, []);
  const save = () => {
    if (key.trim()) setAIKey(key.trim()); else clearAIKey();
    setAIModel(model.trim() || 'gpt-4o-mini');
    setStatus('Saved'); setTimeout(()=>setStatus(''), 1200);
  };
  const test = async () => {
    try { setStatus('Testing…'); const res = await chatJson('Return {"ok": true} as JSON'); setStatus(res?.ok ? 'Key OK' : 'Unexpected response'); }
    catch (e:any) { setStatus(`Error: ${e.message || 'Test failed'}`); }
  };
  return (
    <div className="card p-4">
      <h2 className="font-semibold">BYOK</h2>
      <div className="text-sm text-muted mb-2">Bring your own model API key (stored locally).</div>
      <div className="flex flex-col gap-2">
        <input className="border rounded px-3 py-2" placeholder="API key" value={key} onChange={(e)=>setKey(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Model (e.g., gpt-4o-mini)" value={model} onChange={(e)=>setModel(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={save}>Save</button>
          <button className="btn btn-primary" onClick={test}>Test</button>
        </div>
        {status && <div className="text-xs text-muted">{status}</div>}
      </div>
    </div>
  );
}

function GoogleAccountCard() {
  const auth = useAuth();
  const status = auth.status;
  const onConnect = async () => { await signInWithGoogle(); };
  const onDisconnect = async () => { await signOutGoogle(); };
  return (
    <div className="card p-4">
      <h2 className="font-semibold">Google Account</h2>
      <div className="text-sm text-muted mb-2">Connect or disconnect your Google account for Drive backup.</div>
      {status !== 'signed_in' ? (
        <button className="btn btn-primary" onClick={onConnect}>{status === 'signing_in' ? 'Signing in…' : 'Sign in with Google'}</button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="text-sm text-aptum-blue">Connected</div>
          <button className="btn btn-outline" onClick={onDisconnect}>Disconnect</button>
        </div>
      )}
      {status === 'error' && auth.error && <div className="text-xs text-red-600 mt-2">{auth.error}</div>}
    </div>
  );
}

function ExportImportCard() {
  const [status, setStatus] = useState<string>('');

  const onExport = async () => {
    setStatus('Preparing export…');
    const blob = await exportZip();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'aptum_export.zip'; a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported');
    setTimeout(()=>setStatus(''), 1500);
  };

  const onImport = async (file: File) => {
    setStatus('Importing…');
    try {
      await importLocalZip(file);
      setStatus('Imported');
    } catch (e:any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="font-semibold">Export / Import</h2>
      <div className="text-sm text-muted mb-2">Download or restore your complete dataset (JSON zip).</div>
      <div className="flex items-center gap-2">
        <button className="btn btn-outline" onClick={onExport}>Export Zip</button>
        <label className="btn btn-primary">
          Import Zip
          <input type="file" accept=".zip" className="hidden" onChange={(e)=>{
            const f = e.target.files?.[0]; if (f) onImport(f);
          }} />
        </label>
      </div>
      {status && <div className="text-xs text-muted mt-2">{status}</div>}
    </div>
  );
}

function SyncPrefsCard() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  useEffect(() => {
    (async () => {
      const s = await getSettings<any>();
      setEnabled(!!s.autoSync);
    })();
  }, []);
  const toggle = async () => {
    const next = !enabled; setEnabled(next);
    const s = await getSettings<any>();
    s.autoSync = next; await setSettings(s); setStatus('Saved'); setTimeout(()=>setStatus(''), 1200);
  };
  return (
    <div className="card p-4">
      <h2 className="font-semibold">Sync Preferences</h2>
      <div className="text-sm text-muted">Automatically sync to Drive after generating a week or completing a session.</div>
      <div className="mt-2 flex items-center gap-2">
        <button className={'btn ' + (enabled ? 'btn-primary' : 'btn-outline')} onClick={toggle}>{enabled ? 'Auto Sync: ON' : 'Auto Sync: OFF'}</button>
        {status && <span className="text-xs text-muted">{status}</span>}
      </div>
    </div>
  );
}

function AthleteProfileCard() {
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
  const [profile, setP] = useState<AthleteProfile>({ units: 'metric' });
  const [heightFt, setHeightFt] = useState<number | ''>('');
  const [heightIn, setHeightIn] = useState<number | ''>('');
  const [weightLb, setWeightLb] = useState<number | ''>('');
  const [autoSaved, setAutoSaved] = useState(false);
  useEffect(() => { (async () => { const p = await getProfile<AthleteProfile>(); setP({ units: 'metric', ...p }); })(); }, []);
  function toNumber(v: any) { if (v === '' || v === null || v === undefined) return undefined; const n = Number(v); return Number.isFinite(n) ? n : undefined; }
  const save = async () => {
    const units = profile.units || 'metric';
    let heightCm = toNumber(profile.heightCm);
    let weightKg = toNumber(profile.weightKg);
    if (units === 'imperial') {
      const ft = toNumber(heightFt) || 0; const inch = toNumber(heightIn) || 0; const totalIn = ft * 12 + inch; heightCm = totalIn ? Math.round(totalIn * 2.54) : undefined;
      const lb = toNumber(weightLb); weightKg = lb !== undefined ? Math.round(lb * 0.453592 * 10) / 10 : undefined;
    }
    await setProfile({ ...profile, heightCm, weightKg }); setAutoSaved(true); setTimeout(()=>setAutoSaved(false), 800);
  };
  useEffect(() => { const t = setTimeout(() => { (async()=>{ await save(); })(); }, 600); return () => clearTimeout(t); }, [profile.units, profile.ageYears, profile.gender, profile.heightCm, profile.weightKg, profile.liftingExperience, profile.endurance, heightFt, heightIn, weightLb]);

  const ENDURANCE_LEVELS: Record<string, { label: string; desc: string }> = {
    beginner: { label: 'Beginner', desc: 'You get tired easily during longer workouts or daily activities. Cardio feels tough, and recovery takes a while.' },
    developing: { label: 'Developing', desc: 'You can jog, cycle, or train steadily for 30–45 minutes. You’re starting to feel more comfortable with conditioning but still gas out on intense days.' },
    trained: { label: 'Trained', desc: 'You do endurance or mixed training a few times a week. You can stay active for about an hour without fading and recover well between sessions.' },
    athletic: { label: 'Athletic', desc: 'You can train hard and long. Back-to-back workouts or long games don’t drain you much, and you bounce back quickly.' },
    elite: { label: 'Elite', desc: 'You have exceptional stamina and recovery. You can push at high intensity for long stretches and stay sharp across demanding training weeks.' }
  };

  return (
    <div className="card p-4">
      <h2 className="font-semibold">Athlete Profile</h2>
      <div className="grid gap-3 mt-2">
        <UnitToggle value={profile.units || 'metric'} onChange={(u)=>setP((p)=>({ ...p, units: u }))} />
        <label className="grid gap-1">
          <span className="text-sm text-muted">Age</span>
          <input className="rounded-xl border border-line px-3 py-2" type="number" min={10} max={95} placeholder="30" value={profile.ageYears ?? ''} onChange={(e)=>setP((p)=>({ ...p, ageYears: toNumber(e.target.value) }))} />
        </label>
        <SelectBox label="Sex" value={profile.gender || ''} onChange={(e)=>setP((p)=>({ ...p, gender: (e.target.value || undefined) as any }))}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </SelectBox>
        {profile.units === 'imperial' ? (
          <div className="grid gap-2">
            <span className="text-sm text-muted">Height</span>
            <div className="grid grid-cols-2 gap-2">
              <InputWithUnit unit="ft" type="number" placeholder="5" value={heightFt} onChange={(e)=>setHeightFt(toNumber(e.target.value) ?? '')} />
              <InputWithUnit unit="in" type="number" placeholder="10" value={heightIn} onChange={(e)=>setHeightIn(toNumber(e.target.value) ?? '')} />
            </div>
            <InputWithUnit label="Weight" unit="lb" type="number" placeholder="165" value={weightLb} onChange={(e)=>setWeightLb(toNumber(e.target.value) ?? '')} />
          </div>
        ) : (
          <>
            <InputWithUnit label="Height" unit="cm" type="number" placeholder="175" value={profile.heightCm ?? ''} onChange={(e)=>setP((p)=>({ ...p, heightCm: toNumber(e.target.value) }))} />
            <InputWithUnit label="Weight" unit="kg" type="number" placeholder="70" value={profile.weightKg ?? ''} onChange={(e)=>setP((p)=>({ ...p, weightKg: toNumber(e.target.value) }))} />
          </>
        )}
        <SelectBox label="Endurance Capacity" value={profile.endurance || ''} onChange={(e)=>setP((p)=>({ ...p, endurance: (e.target.value || undefined) }))}>
          <option value="">Select your level</option>
          <option value="beginner">Beginner</option>
          <option value="developing">Developing</option>
          <option value="trained">Trained</option>
          <option value="athletic">Athletic</option>
          <option value="elite">Elite</option>
        </SelectBox>
        {profile.endurance && (
          <p className="text-sm text-muted">{ENDURANCE_LEVELS[profile.endurance]?.desc}</p>
        )}
        <SelectBox label="Resistance Training Experience" value={profile.liftingExperience || ''} onChange={(e)=>setP((p)=>({ ...p, liftingExperience: (e.target.value || undefined) }))}>
          <option value="">Select your level</option>
          <option value="novice">Novice</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </SelectBox>
        {autoSaved && <div className="text-xs text-aptum-blue">Auto‑saved</div>}
      </div>
    </div>
  );
}
