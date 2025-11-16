import { useAuth } from '@/stores/auth';
import { signInWithGoogle } from '@/services/auth';
import { useMemo, useState } from 'react';
import { byok } from '@/services/byok';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function Connect() {
  const auth = useAuth();
  const nav = useNavigate();
  const savedKey = useMemo(() => byok.get().apiKey || '', []);
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const notSignedIn = auth.status !== 'signed_in';
  const currentKey = apiKey.trim() || savedKey;
  const noKey = !currentKey;
  
  // Show abbreviated only after successful test
  const showAbbreviated = testStatus === 'success' && apiKey.trim();

  // Abbreviate key for display
  const abbreviateKey = (key: string) => {
    if (!key || key.length < 12) return key;
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
  };

  const testApiKey = async () => {
    const keyToTest = currentKey;
    if (!keyToTest) return;

    setTestStatus('testing');
    setTestError('');

    try {
      // Test with a simple API call to verify the key works
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API returned ${response.status}`);
      }

      setTestStatus('success');
      // Save the key if test succeeds
      await byok.set({ apiKey: keyToTest });
    } catch (error) {
      setTestStatus('error');
      setTestError(error instanceof Error ? error.message : 'Failed to verify API key');
    }
  };

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
        <div className="grid gap-2 max-w-xl">
          <label className="grid gap-1">
            <span className="text-sm">API Key</span>
            <div className="flex gap-2 items-center">
              {showAbbreviated ? (
                <div className="input flex-1 bg-gray-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{abbreviateKey(apiKey)}</span>
                </div>
              ) : (
                <input 
                  type="password"
                  className="input flex-1" 
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestStatus('idle');
                    setTestError('');
                  }}
                  placeholder="sk-..." 
                />
              )}
              {currentKey && !showAbbreviated && (
                <button 
                  className="btn btn-sm flex items-center gap-1.5 whitespace-nowrap"
                  onClick={testApiKey}
                  disabled={testStatus === 'testing'}
                >
                  {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                  {testStatus === 'testing' ? 'Testing...' : 'Test Key'}
                </button>
              )}
            </div>
          </label>
          {savedKey && !apiKey && (
            <div className="text-xs text-muted flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              Saved: {abbreviateKey(savedKey)}
            </div>
          )}
          {showAbbreviated && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              API key verified successfully!
            </div>
          )}
          {testStatus === 'error' && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {testError || 'Invalid API key'}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={async () => { const k = apiKey.trim() || savedKey; if (k) await byok.set({ apiKey: k }); nav('/onboarding/goals'); }}>Continue</button>
          <button className="btn" onClick={() => nav('/onboarding/profile')}>Back</button>
        </div>
      </div>
    </div>
  );
}
