import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const nav = useNavigate();
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Welcome to APTUM</h1>
      <p className="text-sm text-muted">Build your private, coach-guided training on your device. You can connect Google Drive for encrypted backups, and optionally add your own AI key. You can modify everything later in Settings.</p>
      <ul className="list-disc pl-5 text-sm text-muted">
        <li>Client-only PWA with offline-first storage</li>
        <li>Encrypted sync to your Google Drive App Folder</li>
        <li>Optional BYOK for AI coach</li>
      </ul>
      <div>
        <button className="btn btn-primary" onClick={()=>nav('/onboarding/profile')}>Begin Setup</button>
      </div>
    </div>
  );
}
