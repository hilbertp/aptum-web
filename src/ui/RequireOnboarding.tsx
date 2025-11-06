import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSettings } from '@/services/storage';

export default function RequireOnboarding({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings<any>();
      setCompleted(!!s.onboardingCompleted);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted">Loading…</div>;
  if (!completed) return <Navigate to="/onboarding/welcome" replace />;
  return <>{children}</>;
}
