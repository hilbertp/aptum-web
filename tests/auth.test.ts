/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Helper to reset modules between tests
async function freshAuth() {
  const mod = await import('@/services/auth');
  return mod;
}

beforeEach(() => {
  // Reset localStorage
  localStorage.clear();
  // Ensure env var for CLIENT_ID exists for tests
  (process as any).env = { ...(process as any).env, VITE_GOOGLE_CLIENT_ID: 'test-client-id' };
  // Reset global fetch
  // @ts-expect-error: mock fetch on global in jsdom env
  global.fetch = vi.fn();
  // Mock GIS client
  (window as any).google = {
    accounts: {
      oauth2: {
        initTokenClient: vi.fn(() => {
          const client: any = {
            callback: (_r: any) => {},
            requestAccessToken: (_opts?: any) => {
              // default: immediate success
              setTimeout(() => client.callback({ access_token: 'tok_test', expires_in: 3600 }), 0);
            }
          };
          return client;
        }),
        revoke: vi.fn((_token: string, done: () => void) => done())
      }
    }
  };
});

describe('auth: google sign-in flow', () => {
  it('signInWithGoogle stores token and updates state', async () => {
    const { signInWithGoogle } = await freshAuth();
    const { driveSync } = await import('@/services/driveSync');
    const { useAuth } = await import('@/stores/auth');
    await signInWithGoogle();
    // Allow callback to fire
    await new Promise((r) => setTimeout(r, 5));
    const saved = JSON.parse(localStorage.getItem('aptum.auth') || '{}');
    expect(saved.accessToken).toBe('tok_test');
    expect(driveSync.hasToken).toBe(true);
    expect(useAuth.getState().status).toBe('signed_in');
  });

  it('initAuth restores stored token', async () => {
    const expiresAt = Date.now() + 60_000;
    localStorage.setItem('aptum.auth', JSON.stringify({ accessToken: 'tok_restore', expiresAt }));
    const { initAuth } = await freshAuth();
    const { driveSync } = await import('@/services/driveSync');
    const { useAuth } = await import('@/stores/auth');
    await initAuth();
    expect(driveSync.hasToken).toBe(true);
    expect(useAuth.getState().accessToken).toBe('tok_restore');
  });

  it('signOutGoogle revokes and clears', async () => {
    const expiresAt = Date.now() + 60_000;
    localStorage.setItem('aptum.auth', JSON.stringify({ accessToken: 'tok_restore', expiresAt }));
    const { initAuth, signOutGoogle } = await freshAuth();
    const { driveSync } = await import('@/services/driveSync');
    const { useAuth } = await import('@/stores/auth');
    await initAuth();
    await signOutGoogle();
    expect(localStorage.getItem('aptum.auth')).toBeNull();
    expect(driveSync.hasToken).toBe(false);
    expect(useAuth.getState().status).toBe('signed_out');
  });
});

describe('driveSync: 401 triggers refresher and retry', () => {
  it('retries once after silent refresh', async () => {
    const { driveSync } = await import('@/services/driveSync');
    driveSync.setAccessToken('expired');
    driveSync.setTokenRefresher(async () => 'tok_new');
    // Mock fetch: first 401, then 200
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ files: [{ id: '1', name: 'x' }] }), { status: 200 }));
    // @ts-expect-error: override global fetch mock
    global.fetch = fetchMock;
    const file = await driveSync.findFileByName('x');
    expect(file?.id).toBe('1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
