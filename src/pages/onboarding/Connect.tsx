import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { signInWithGoogle, signOutGoogle } from '@/services/auth';
import { getAIKey, setAIKey, clearAIKey, getAIModel, setAIModel } from '@/services/byok';
import { chatJson } from '@/services/llm';
 

export default function Connect() {
  const auth = useAuth();
  const [aiKey, setKey] = useState<string>('');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [aiStatus, setAIStatus] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const hasClientId = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID || clientId);

  useEffect(() => {
    setKey(getAIKey() || '');
    setModel(getAIModel());
    try {
      const existing = localStorage.getItem('aptum.googleClientId') || '';
      setClientId(existing);
    } catch { void 0; }
  }, []);

  const saveKey = () => {
    if (aiKey.trim()) setAIKey(aiKey.trim()); else clearAIKey();
    setAIModel(model.trim() || 'gpt-4o-mini');
    setAIStatus('Saved');
    setTimeout(() => setAIStatus(''), 1200);
  };

  const testKey = async () => {
    try {
      setAIStatus('Testing…');
      const res = await chatJson('Return {"ok": true} as JSON');
      if (res?.ok === true) setAIStatus('Key OK'); else setAIStatus('Unexpected response');
    } catch (e:any) {
      setAIStatus(`Error: ${e.message || 'Test failed'}`);
    }
  };

  

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Connect Services</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Google Drive</h2>
              <p className="text-sm text-muted">Required for encrypted backups into your private AppData folder.</p>
            </div>
            {auth.status !== 'signed_in' ? (
              <button className="btn btn-primary" onClick={signInWithGoogle} disabled={!hasClientId}>
                {hasClientId ? (auth.status === 'signing_in' ? 'Signing in…' : 'Sign in with Google') : 'Configure Client ID'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-sm text-aptum-blue">Connected</div>
                <button className="btn btn-outline btn-sm" onClick={signOutGoogle}>Disconnect</button>
              </div>
            )}
          </div>
          {!hasClientId && (
            <div className="mt-2">
              <div className="text-xs text-red-600 mb-2">Missing Google Client ID. Paste it below to use locally, or set VITE_GOOGLE_CLIENT_ID in .env.</div>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Paste your OAuth Client ID"
                  value={clientId}
                  onChange={(e)=>setClientId(e.target.value)}
                />
                <button
                  className="btn btn-outline"
                  onClick={()=>{ try { localStorage.setItem('aptum.googleClientId', clientId.trim()); window.location.reload(); } catch { void 0; } }}
                  disabled={!clientId.trim()}
                >Save</button>
              </div>
            </div>
          )}
          {auth.status === 'error' && auth.error && (
            <div className="text-xs text-red-600 mt-2">{auth.error}</div>
          )}
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">BYOK (Optional)</h2>
          <div className="text-sm text-muted mb-2">Bring your own model API key. Stored locally and never leaves your device.</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input className="border rounded px-3 py-2 w-full" placeholder="Paste your API key" value={aiKey} onChange={(e)=>setKey(e.target.value)} />
              <button className="btn btn-outline" onClick={saveKey}>Save</button>
            </div>
            <div className="flex items-center gap-2">
              <input className="border rounded px-3 py-2 w-full" placeholder="Model (e.g., gpt-4o-mini)" value={model} onChange={(e)=>setModel(e.target.value)} />
              <button className="btn btn-outline" onClick={testKey}>Test</button>
            </div>
            {aiStatus && <div className="text-xs text-muted">{aiStatus}</div>}
            <div className="text-xs text-muted">You can leave this blank and add it later in Settings.</div>
          </div>
        </div>
      </div>
      <div className="text-xs text-muted">Continue to set your goals and plan next.</div>
    </div>
  );
}
