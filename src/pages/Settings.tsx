import { useEffect, useMemo, useState } from 'react';
import { byok } from '@/services/byok';
import { useSettings } from '@/stores/settings';
import { embed } from '@/services/llm';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  // API key is always visible per product policy

  const savedKey = useMemo(() => byok.get().apiKey || '', []);
  useEffect(() => {
    // Do not prefill the input; keep it empty by default.
    setApiKey('');
  }, []);

  const mask = (k: string) => (k ? `${k.slice(0, 6)}…${k.slice(-4)}` : '');

  const settings = useSettings();
  const [gisClientId, setGisClientId] = useState<string>(() => {
    try { return localStorage.getItem('gis.client_id') || ''; } catch { return ''; }
  });
  const saveGis = () => {
    try { localStorage.setItem('gis.client_id', gisClientId || ''); setStatus('Saved Google Client ID.'); setTimeout(() => setStatus(null), 2000); } catch {}
  };

  const save = () => {
    byok.set({ apiKey });
    setStatus('Saved.');
    setTimeout(() => setStatus(null), 2500);
  };

  const clear = () => {
    byok.clear();
    setApiKey('');
    setStatus('Cleared.');
    setTimeout(() => setStatus(null), 2500);
  };

  const testConnection = async () => {
    setTesting(true);
    setStatus(null);
    try {
      // Save the typed key first (if provided), otherwise use existing saved key
      const effectiveKey = (apiKey && apiKey.trim().length > 0) ? apiKey.trim() : savedKey;
      if (!effectiveKey) throw new Error('No API key');
      if (effectiveKey !== savedKey) byok.set({ apiKey: effectiveKey });
      const vec = await embed(['hello aptum']);
      if (Array.isArray(vec) && vec[0]?.length) {
        setStatus('Connection OK');
      } else {
        setStatus('Connection failed: malformed response');
      }
    } catch (e: any) {
      setStatus(`Connection error: ${e?.message || e}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold">Units</h2>
          <div className="text-sm text-muted mb-2">Switch between metric and imperial. Saved to app settings.</div>
          <select className="input max-w-xs" value={settings.units} onChange={e => settings.setUnits(e.target.value as any)}>
            <option value="metric">metric</option>
            <option value="imperial">imperial</option>
          </select>
        </div>
        <div className="card p-4 grid gap-3">
          <h2 className="font-semibold">BYOK</h2>
          <div className="text-sm text-muted">Your API key is stored locally on this device (localStorage). It is never sent to our servers.</div>
          <label className="grid gap-1">
            <span className="text-sm">API Key</span>
            <input className="input" type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
          </label>
          {savedKey && <div className="text-xs text-muted">Saved: {mask(savedKey)}</div>}
          {/* Intentionally no embedding model UI. It is fixed and configured at build time. */}
          <div className="flex gap-2 mt-2">
            <button className="btn" onClick={save} type="button">Save</button>
            <button className="btn" onClick={async () => { byok.set({ apiKey }); await testConnection(); }} disabled={testing} type="button">{testing ? 'Testing…' : 'Test Connection'}</button>
          </div>
          {status && <div className="text-sm text-muted">{status}</div>}
        </div>
        <div className="card p-4 grid gap-3">
          <h2 className="font-semibold">Google OAuth (dev)</h2>
          <div className="text-sm text-muted">Set a Google Client ID for testing on this device if it isn’t provided by the environment.</div>
          <label className="grid gap-1 max-w-xl">
            <span className="text-sm">Client ID</span>
            <input className="input" value={gisClientId} onChange={e => setGisClientId(e.target.value)} placeholder="12345-abcdefg.apps.googleusercontent.com" />
          </label>
          <div className="flex gap-2">
            <button className="btn" onClick={saveGis} type="button">Save</button>
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Export / Import</h2>
          <div className="text-sm text-muted">Download or restore your complete dataset (JSON zip).</div>
        </div>
      </div>
    </div>
  );
}
