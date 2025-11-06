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
import Weekly from './pages/Weekly';
import OnboardingShell from './pages/OnboardingShell';
import RequireOnboarding from './ui/RequireOnboarding';
import Welcome from './pages/onboarding/Welcome';
import Profile from './pages/onboarding/Profile';
import Connect from './pages/onboarding/Connect';
import Goals from './pages/onboarding/Goals';
import Plan from './pages/onboarding/Plan';
import RecoverySetup from './pages/onboarding/RecoverySetup';
import Preview from './pages/onboarding/Preview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/strategy" replace />} />
          <Route path="/onboarding" element={<OnboardingShell />}>
            <Route index element={<Navigate to="/onboarding/welcome" replace />} />
            <Route path="welcome" element={<Welcome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="connect" element={<Connect />} />
            <Route path="goals" element={<Goals />} />
            <Route path="plan" element={<Plan />} />
            <Route path="recovery-setup" element={<RecoverySetup />} />
            <Route path="preview" element={<Preview />} />
          </Route>
          <Route element={<RequireOnboarding><div /></RequireOnboarding>}>
            {/* The wrapper above gates the following routes; children are ignored, we render actual pages below */}
          </Route>
          <Route path="/strategy" element={<RequireOnboarding><Strategy /></RequireOnboarding>} />
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
