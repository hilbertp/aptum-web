import { useAuth } from '@/stores/auth';
import { signInWithGoogle } from '@/services/auth';
import { useMemo, useState } from 'react';
import { byok } from '@/services/byok';
import { useNavigate } from 'react-router-dom';

export default function Connect() {
  const auth = useAuth();
  const nav = useNavigate();
  const savedKey = useMemo(() => byok.get().apiKey || '', []);
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="grid gap-4">
      <div className="card p-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Google Sign-In</h2>
          <p className="text-sm text-muted">Required to set up your private Drive App Folder for data sync.</p>
        </div>
        <button className="btn btn-primary" onClick={signInWithGoogle}>
          {auth.status === 'signing_in' ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>
      {auth.status === 'error' && (
        <div className="text-sm text-red-600">{auth.error || 'Google sign-in failed.'}</div>
      )}
      <div className="card p-4 grid gap-3">
        <h2 className="font-semibold">GPT‑5 Access (BYOK)</h2>
        <label className="grid gap-1 max-w-xl">
          <span className="text-sm">API Key</span>
          <input className="input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
        </label>
        {savedKey && <div className="text-xs text-muted">Saved: {savedKey.slice(0, 6)}…{savedKey.slice(-4)}</div>}
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => { const k = apiKey.trim() || savedKey; if (k) byok.set({ apiKey: k }); nav('/onboarding/profile'); }}>Continue</button>
          <button className="btn" onClick={() => nav('/onboarding/welcome')}>Back</button>
        </div>
      </div>
    </div>
  );
}
