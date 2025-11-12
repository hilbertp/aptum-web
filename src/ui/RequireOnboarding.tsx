import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { get } from '@/services/storage';

export default function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasPlan, setHasPlan] = useState<boolean>(false);
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      const p = await get('plan', 'current');
      setHasPlan(!!p);
      setReady(true);
    })();
  }, [loc.pathname]);

  if (!ready) return <div className="text-sm text-muted">Loading…</div>;
  if (!hasPlan) return <Navigate to="/onboarding/welcome" replace />;
  return <>{children}</>;
}
