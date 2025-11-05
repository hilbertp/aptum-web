import { useAuth } from '@/stores/auth';
import { driveSync } from './driveSync';

declare global {
  interface Window {
    google: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const DRIVE_SCOPES = (import.meta.env.VITE_GOOGLE_DRIVE_SCOPES as string) || 'https://www.googleapis.com/auth/drive.appdata';

export function signInWithGoogle() {
  const auth = useAuth.getState();
  auth.setSigningIn();

  const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPES,
    prompt: 'consent',
    callback: (resp: any) => {
      if (resp && resp.access_token) {
        driveSync.setAccessToken(resp.access_token);
        useAuth.getState().setSignedIn(resp.access_token);
      } else {
        useAuth.getState().setError('No access token received');
      }
    }
  });

  if (!tokenClient) {
    auth.setError('Google Identity Services not loaded');
    return;
  }
  tokenClient.requestAccessToken();
}
