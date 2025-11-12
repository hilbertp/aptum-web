import { useAuth } from '@/stores/auth';
import { driveSync } from './driveSync';

declare global {
  interface Window {
    google: any;
  }
}

function getGoogleClientId(): string {
  // Priority: env → meta tag → localStorage (dev)
  const envId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
  if (envId) return envId;
  const metaId = (document.querySelector('meta[name="google-signin-client_id"]') as HTMLMetaElement | null)?.content || '';
  if (metaId) return metaId;
  try {
    const ls = window.localStorage?.getItem('gis.client_id') || '';
    if (ls) return ls;
  } catch (err) {
    void err;
  }
  return '';
}

const DRIVE_SCOPES = (import.meta.env.VITE_GOOGLE_DRIVE_SCOPES as string) || 'https://www.googleapis.com/auth/drive.appdata';

export function signInWithGoogle() {
  const auth = useAuth.getState();
  auth.setSigningIn();

  const CLIENT_ID = getGoogleClientId();
  if (!CLIENT_ID) {
    useAuth.getState().setError('Missing Google Client ID. Set it in Settings (dev) or provide VITE_GOOGLE_CLIENT_ID.');
    return;
  }

  const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPES,
    prompt: 'consent',
    callback: (resp: any) => {
      // Clear pending timeout on callback
      if (timeoutId) window.clearTimeout(timeoutId);
      if (resp && resp.access_token) {
        driveSync.setAccessToken(resp.access_token);
        useAuth.getState().setSignedIn(resp.access_token);
      } else {
        useAuth.getState().setError('No access token received');
      }
    }
  });

  if (!tokenClient) {
    auth.setError('Google Identity Services (GIS) not loaded. Check the GIS script and allowed origins.');
    return;
  }
  // If the popup is blocked or cookies disabled, GIS may never call our callback.
  // Set a timeout to surface a helpful error and allow retry.
  const timeoutId = window.setTimeout(() => {
    if (useAuth.getState().status === 'signing_in') {
      useAuth.getState().setError('Google sign-in timed out. Allow popups and third-party cookies, then try again.');
    }
  }, 10000);
  tokenClient.requestAccessToken();
}
