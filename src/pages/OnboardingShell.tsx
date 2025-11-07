import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const steps = [
  { path: '/onboarding/welcome', label: 'Welcome' },
  { path: '/onboarding/profile', label: 'Profile' },
  { path: '/onboarding/connect', label: 'Connect' },
  { path: '/onboarding/goals', label: 'Goals' },
  { path: '/onboarding/plan', label: 'Plan' },
  { path: '/onboarding/recovery-setup', label: 'Recovery' },
  { path: '/onboarding/preview', label: 'Preview' }
];

export default function OnboardingShell() {
  const { pathname } = useLocation();
  const idx = Math.max(0, steps.findIndex((s) => pathname.startsWith(s.path)));
  const nav = useNavigate();

  const next = () => {
    const n = Math.min(steps.length - 1, idx + 1);
    const fallback = steps.at(-1)?.path || '/onboarding/welcome';
    const to = steps[n]?.path || fallback;
    nav(to);
  };
  const prev = () => {
    const p = Math.max(0, idx - 1);
    const fallback = steps[0]?.path || '/onboarding/welcome';
    const to = steps[p]?.path || fallback;
    nav(to);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="text-sm text-muted">Step {idx + 1} of {steps.length}</div>
          <div className="mt-2 flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.path} className={'h-1 flex-1 rounded ' + (i <= idx ? 'bg-aptum-blue' : 'bg-line')}></div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="sticky bottom-0 inset-x-0 border-t border-line bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <button className="btn btn-outline" onClick={prev} disabled={idx === 0}>Back</button>
          <button className="btn btn-primary" onClick={next} disabled={idx >= steps.length - 1}>{idx >= steps.length - 1 ? 'Done' : 'Continue'}</button>
        </div>
      </footer>
    </div>
  );
}
