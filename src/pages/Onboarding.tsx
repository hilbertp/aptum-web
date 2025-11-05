import { useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { signInWithGoogle } from '@/services/auth';

export default function Onboarding() {
  const auth = useAuth();
  useEffect(() => {}, []);

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Welcome to APTUM</h1>
      <ol className="list-decimal pl-5 space-y-2 text-muted">
        <li>Sign in with Google (Drive consent)</li>
        <li>Performance profile</li>
        <li>BYOK setup (optional)</li>
        <li>Goals interview</li>
        <li>Mesocycle proposal</li>
        <li>Recovery setup</li>
        <li>First session preview</li>
      </ol>
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Google Sign-In</h2>
            <p className="text-sm text-muted">Required to set up your private Drive App Folder for data sync.</p>
          </div>
          {auth.status !== 'signed_in' ? (
            <button className="btn btn-primary" onClick={signInWithGoogle}>
              {auth.status === 'signing_in' ? 'Signing in…' : 'Sign in with Google'}
            </button>
          ) : (
            <div className="text-sm text-aptum-blue">Connected</div>
          )}
        </div>
      </div>
    </div>
  );
}
