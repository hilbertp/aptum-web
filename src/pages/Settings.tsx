export default function Settings() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold">Units</h2>
          <div className="text-sm text-muted">Metric / Imperial</div>
        </div>
        <BYOKCard />
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
  return (
    <div className="card p-4">
      <h2 className="font-semibold">BYOK</h2>
      <div className="text-sm text-muted">Store your model API key locally (encrypted). Used for AI coach.</div>
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
