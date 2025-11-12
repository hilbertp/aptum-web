import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { onboardingCopy } from '@/content/onboarding';

export default function OnboardingShell() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const stepIndex = onboardingCopy.steps.findIndex((s: any) => pathname.includes(`/onboarding/${s.id}`));

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-4 text-sm text-muted">Step {Math.max(1, stepIndex + 1)} of {onboardingCopy.steps.length}</div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {onboardingCopy.steps.map((s: any, i: number) => (
          <button
            key={s.id}
            className={`text-sm rounded-full border px-3 py-1 transition ${i <= stepIndex ? 'bg-aptum-blue text-white border-aptum-blue' : 'border-line text-muted hover:bg-panel'}`}
            onClick={() => nav(`/onboarding/${s.id}`)}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>
      <div className="min-h-[60vh]">
        <Outlet />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {onboardingCopy.steps.map((s: any) => (
          <NavLink key={s.id} to={`/onboarding/${s.id}`} className={({ isActive }) => `text-xs px-2 py-1 rounded ${isActive ? 'bg-aptum-blue text-white' : 'text-muted hover:bg-panel border border-line'}`}>{s.label}</NavLink>
        ))}
      </div>
    </div>
  );
}
