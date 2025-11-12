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

  const notSignedIn = auth.status !== 'signed_in';
  const noKey = !savedKey && !apiKey.trim();

  return (
    <div className="grid gap-4">
      <div className="card p-4 grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Google Drive (optional)</h2>
            <p className="text-sm text-muted">We use your private Google Drive App Folder to store your data locally under your account. This keeps your information under your control and enables sync/backup across devices.</p>
          </div>
          <button className="btn btn-primary" onClick={signInWithGoogle}>
            {auth.status === 'signing_in' ? 'Signing in…' : (notSignedIn ? 'Sign in with Google' : 'Connected')}
          </button>
        </div>
        {notSignedIn && (
          <div className="text-xs text-amber-600">Warning: Without Drive, sync/backup will be disabled. You can still continue, but data may only live in this browser.</div>
        )}
        {auth.status === 'error' && (
          <div className="text-sm text-red-600">{auth.error || 'Google sign-in failed.'}</div>
        )}
      </div>

      <div className="card p-4 grid gap-3">
        <h2 className="font-semibold">GPT‑5 Access (BYOK, optional)</h2>
        <p className="text-sm text-muted">Paste your GPT‑5 API key to enable all AI features (KB‑aided interview, plan generation, retrieval). We never send your key to our servers—it's stored on this device only.</p>
        {noKey && (
          <div className="text-xs text-amber-600">Warning: Without an API key, AI features will not work. You can continue, but the coach chat and plan generation will be limited or disabled.</div>
        )}
        <label className="grid gap-1 max-w-xl">
          <span className="text-sm">API Key</span>
          <input className="input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
        </label>
        {savedKey && <div className="text-xs text-muted">Saved: {savedKey.slice(0, 6)}…{savedKey.slice(-4)}</div>}
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => { const k = apiKey.trim() || savedKey; if (k) byok.set({ apiKey: k }); nav('/onboarding/goals'); }}>Continue</button>
          <button className="btn" onClick={() => nav('/onboarding/profile')}>Back</button>
        </div>
      </div>
    </div>
  );
}
