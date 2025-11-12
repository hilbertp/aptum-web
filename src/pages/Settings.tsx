import { useEffect, useState } from 'react';
import { byok } from '@/services/byok';
import { useSettings } from '@/stores/settings';
import { embed } from '@/services/llm';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  // API key is always visible per product policy

  useEffect(() => {
    const cfg = byok.get();
    setApiKey(cfg.apiKey || '');
  }, []);

  const settings = useSettings();

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
          {/* Intentionally no embedding model UI. It is fixed and configured at build time. */}
          <div className="flex gap-2 mt-2">
            <button className="btn" onClick={save} type="button">Save</button>
            <button className="btn" onClick={async () => { byok.set({ apiKey }); await testConnection(); }} disabled={testing} type="button">{testing ? 'Testing…' : 'Test Connection'}</button>
          </div>
          {status && <div className="text-sm text-muted">{status}</div>}
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Export / Import</h2>
          <div className="text-sm text-muted">Download or restore your complete dataset (JSON zip).</div>
        </div>
      </div>
    </div>
  );
}
