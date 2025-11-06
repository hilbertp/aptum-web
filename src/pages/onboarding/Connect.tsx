import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { signInWithGoogle } from '@/services/auth';
import { getAIKey, setAIKey, clearAIKey } from '@/services/byok';
 

export default function Connect() {
  const auth = useAuth();
  const [aiKey, setKey] = useState<string>('');

  useEffect(() => {
    setKey(getAIKey() || '');
  }, []);

  const saveKey = () => {
    if (aiKey.trim()) setAIKey(aiKey.trim());
    else clearAIKey();
    // Saved notice is optional for MVP; no-op visual feedback for now
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
              <button className="btn btn-primary" onClick={signInWithGoogle}>
                {auth.status === 'signing_in' ? 'Signing in…' : 'Sign in with Google'}
              </button>
            ) : (
              <div className="text-sm text-aptum-blue">Connected</div>
            )}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">BYOK (Optional)</h2>
          <div className="text-sm text-muted mb-2">Bring your own model API key. Stored locally and never leaves your device.</div>
          <div className="flex items-center gap-2">
            <input className="border rounded px-3 py-2 w-full" placeholder="Paste your API key" value={aiKey} onChange={(e)=>setKey(e.target.value)} />
            <button className="btn btn-outline" onClick={saveKey}>Save</button>
          </div>
          <div className="text-xs text-muted mt-1">You can leave this blank and add it later in Settings.</div>
        </div>
      </div>
      <div className="text-xs text-muted">Continue to set your goals and plan next.</div>
    </div>
  );
}
