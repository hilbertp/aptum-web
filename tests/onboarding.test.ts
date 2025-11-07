import { describe, it, expect, vi } from 'vitest';

describe('storage helpers for onboarding', () => {
  it('set/get profile works', async () => {
    const { setProfile, getProfile } = await import('@/services/storage');
    await setProfile({ name: 'Test', units: 'metric' });
    const p = await getProfile<any>();
    expect(p.name).toBe('Test');
    expect(p.units).toBe('metric');
  });

  it('onboardingCompleted flag persists in settings', async () => {
    const { getSettings, setSettings } = await import('@/services/storage');
    const s = await getSettings<any>();
    s.onboardingCompleted = true;
    await setSettings(s);
    const s2 = await getSettings<any>();
    expect(s2.onboardingCompleted).toBe(true);
  });
});
