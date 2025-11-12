import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
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
