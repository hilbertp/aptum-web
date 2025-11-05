import { create } from 'zustand';

type AuthState = {
  status: 'signed_out' | 'signing_in' | 'signed_in' | 'error';
  accessToken?: string;
  error?: string;
  setSigningIn: () => void;
  setSignedIn: (token: string) => void;
  setError: (err: string) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  status: 'signed_out',
  accessToken: undefined,
  error: undefined,
  setSigningIn: () => set({ status: 'signing_in', error: undefined }),
  setSignedIn: (token) => set({ status: 'signed_in', accessToken: token, error: undefined }),
  setError: (err) => set({ status: 'error', error: err }),
  signOut: () => set({ status: 'signed_out', accessToken: undefined, error: undefined })
}));
