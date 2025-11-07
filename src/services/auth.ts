import { useAuth } from '@/stores/auth';
import { driveSync } from './driveSync';

declare global {
  interface Window {
    google: any;
  }
}

function getClientId(): string | undefined {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  try {
    const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('aptum.googleClientId') || undefined : undefined;
    return envId || ls;
  } catch {
    return envId;
  }
}
const DRIVE_SCOPES = (import.meta.env.VITE_GOOGLE_DRIVE_SCOPES as string) || 'https://www.googleapis.com/auth/drive.appdata';

type TokenResponse = { access_token: string; expires_in?: number; scope?: string; token_type?: string; error?: string };

const LS_KEY = 'aptum.auth';

let tokenClient: any | null = null;
let refreshTimer: number | null = null;

function persistAuth(token: string, expiresIn?: number) {
  const now = Date.now();
  const ttl = typeof expiresIn === 'number' ? expiresIn * 1000 : 60 * 60 * 1000; // default 1h if not provided
  const expiresAt = now + ttl;
  localStorage.setItem(LS_KEY, JSON.stringify({ accessToken: token, expiresAt }));
}

function loadAuth(): { accessToken: string; expiresAt: number } | null {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (!s) return null;
    const v = JSON.parse(s);
    if (!v?.accessToken || !v?.expiresAt) return null;
    return v;
  } catch {
    return null;
  }
}

function clearAuth() {
  try { localStorage.removeItem(LS_KEY); } catch (e) { void e; }
}

async function waitForGIS(timeoutMs = 10000): Promise<void> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - started > timeoutMs) return reject(new Error('Google Identity Services not loaded'));
      setTimeout(check, 50);
    };
    check();
  });
}

async function ensureTokenClient(): Promise<any> {
  if (tokenClient) return tokenClient;
  await waitForGIS();
  const clientId = getClientId();
  if (!clientId) throw new Error('Missing Google Client ID');
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPES,
    prompt: '',
    callback: (_r: any) => undefined
  });
  return tokenClient;
}

function scheduleRefresh(expiresAt: number) {
  if (refreshTimer) { window.clearTimeout(refreshTimer); refreshTimer = null; }
  const now = Date.now();
  const ahead = 5 * 60 * 1000; // 5 minutes early
  const delay = Math.max(1000, expiresAt - now - ahead);
  refreshTimer = window.setTimeout(async () => {
    try { await silentRefresh(); } catch (e) { console.warn('Silent refresh failed', e); }
  }, delay);
}

async function requestToken(prompt: '' | 'consent' | 'select_account'): Promise<TokenResponse> {
  const client = await ensureTokenClient();
  return new Promise<TokenResponse>((resolve, reject) => {
    client.callback = (resp: TokenResponse) => {
      if (resp?.access_token) return resolve(resp);
      if ((resp as any)?.error) return reject(new Error((resp as any).error));
      return reject(new Error('No access token received'));
    };
    if ('error_callback' in client) {
      client.error_callback = (err: any) => reject(new Error(err?.error ?? 'GIS error'));
    }
    try {
      client.requestAccessToken({ prompt });
    } catch (e) {
      reject(e as any);
    }
  });
}

export async function silentRefresh(): Promise<string | null> {
  try {
    const resp = await requestToken('');
    if (resp?.access_token) {
      persistAuth(resp.access_token, resp.expires_in);
      useAuth.getState().setSignedIn(resp.access_token);
      driveSync.setAccessToken(resp.access_token);
      const stored = loadAuth(); if (stored) scheduleRefresh(stored.expiresAt);
      return resp.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function initAuth() {
  // Restore from storage if present and not expired
  const stored = loadAuth();
  if (stored && stored.expiresAt > Date.now()) {
    driveSync.setAccessToken(stored.accessToken);
    useAuth.getState().setSignedIn(stored.accessToken);
    scheduleRefresh(stored.expiresAt);
  }
  // Provide refresher to driveSync so it can retry on 401
  driveSync.setTokenRefresher(async () => {
    const t = await silentRefresh();
    return t;
  });
}

export async function signInWithGoogle() {
  const auth = useAuth.getState();
  auth.setSigningIn();
  try {
    if (!getClientId()) {
      throw new Error('Missing VITE_GOOGLE_CLIENT_ID. Configure your Google OAuth Client ID.');
    }
    const resp = await requestToken('consent');
    persistAuth(resp.access_token, resp.expires_in);
    driveSync.setAccessToken(resp.access_token);
    useAuth.getState().setSignedIn(resp.access_token);
    const stored = loadAuth(); if (stored) scheduleRefresh(stored.expiresAt);
  } catch (e: any) {
    useAuth.getState().setError(e?.message || 'Sign-in failed');
  }
}

export async function signOutGoogle() {
  const token = useAuth.getState().accessToken;
  try {
    await waitForGIS();
    if (token && window.google?.accounts?.oauth2?.revoke) {
      await new Promise<void>((resolve) => {
        window.google.accounts.oauth2.revoke(token, () => resolve());
      });
    }
  } catch (e) { void e; }
  clearAuth();
  driveSync.setAccessToken(null);
  useAuth.getState().signOut();
  if (refreshTimer) { window.clearTimeout(refreshTimer); refreshTimer = null; }
}
