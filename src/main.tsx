import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Dev-only: ensure no stale service workers/caches persist on the dev host
if (import.meta.env.DEV) {
  (async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister().catch(() => {})));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
  })();
}
import AppShell from './ui/AppShell';
import Strategy from './pages/Strategy';
import Schedule from './pages/Schedule';
import Session from './pages/Session';
import Recovery from './pages/Recovery';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Weekly from './pages/Weekly';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/session" element={<Session />} />
          <Route path="/week" element={<Weekly />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </StrictMode>
);
