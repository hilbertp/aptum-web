import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// GitHub Pages SPA redirect support
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  sessionStorage.removeItem('redirect');
  history.replaceState(null, '', redirect);
}

// Dev-only: ensure no stale service workers/caches persist on the dev host
if (import.meta.env.DEV) {
  (async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister().catch(() => undefined)));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (err) {
      void err;
    }
  })();
}
import AppShell from './ui/AppShell';
import Strategy from './pages/Strategy';
import Schedule from './pages/Schedule';
import Session from './pages/Session';
import Recovery from './pages/Recovery';
import Settings from './pages/Settings';
import Weekly from './pages/Weekly';
import Mesocycle from './pages/Mesocycle';
import OnboardingShell from './pages/OnboardingShell';
import RequireOnboarding from './ui/RequireOnboarding';
import Welcome from './pages/onboarding/Welcome';
import Connect from './pages/onboarding/Connect';
import Profile from './pages/onboarding/Profile';
import Goals from './pages/onboarding/Goals';
import Plan from './pages/onboarding/Plan';
import RecoverySetup from './pages/onboarding/RecoverySetup';
import Preview from './pages/onboarding/Preview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/strategy" replace />} />
          <Route path="/onboarding" element={<OnboardingShell />}>
            <Route index element={<Navigate to="/onboarding/welcome" replace />} />
            <Route path="welcome" element={<Welcome />} />
            <Route path="connect" element={<Connect />} />
            <Route path="profile" element={<Profile />} />
            <Route path="goals" element={<Goals />} />
            <Route path="plan" element={<Plan />} />
            <Route path="recovery-setup" element={<RecoverySetup />} />
            <Route path="preview" element={<Preview />} />
          </Route>
          <Route path="/strategy" element={<RequireOnboarding><Strategy /></RequireOnboarding>} />
          <Route path="/mesocycle" element={<RequireOnboarding><Mesocycle /></RequireOnboarding>} />
          <Route path="/schedule" element={<RequireOnboarding><Schedule /></RequireOnboarding>} />
          <Route path="/session" element={<RequireOnboarding><Session /></RequireOnboarding>} />
          <Route path="/week" element={<RequireOnboarding><Weekly /></RequireOnboarding>} />
          <Route path="/recovery" element={<RequireOnboarding><Recovery /></RequireOnboarding>} />
          <Route path="/settings" element={<RequireOnboarding><Settings /></RequireOnboarding>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </StrictMode>
);
