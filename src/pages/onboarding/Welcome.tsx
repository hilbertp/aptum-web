import { useNavigate } from 'react-router-dom';
import { onboardingCopy } from '@/content/onboarding';

export default function Welcome() {
  const nav = useNavigate();
  return (
    <div className="card p-6">
      <div className="text-xs font-semibold text-aptum-blue">{onboardingCopy.app.badge}</div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome to Aptum</h1>
      <p className="mt-2 text-muted">{onboardingCopy.app.tagline}</p>
      <p className="mt-4 text-muted">Here your health no longer depletes. Aptum learns your biology to align training, recovery, and nutrition with longevity.</p>
      <div className="mt-6 flex gap-2">
        <button className="btn btn-primary" onClick={() => nav('/onboarding/profile')}>Begin</button>
      </div>
    </div>
  );
}
