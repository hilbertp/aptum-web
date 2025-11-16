import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { onboardingCopy } from '@/content/onboarding';
import { useAuth } from '@/stores/auth';
import { signInWithGoogle } from '@/services/auth';
import { driveSync } from '@/services/driveSync';
import { Loader2 } from 'lucide-react';

export default function Welcome() {
  const nav = useNavigate();
  const auth = useAuth();
  const [checkingData, setCheckingData] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleReturningUser = useCallback(async () => {
    setCheckingData(true);
    setRestoreError(null);

    try {
      // Check if user has existing data on Drive
      const hasData = await driveSync.hasExistingData();
      
      if (hasData) {
        // Restore data and navigate to weekly overview
        const restored = await driveSync.downloadAndRestoreData();
        
        if (restored) {
          // Successfully restored - navigate to weekly overview
          nav('/week');
        } else {
          // No data found, continue with onboarding
          nav('/onboarding/profile');
        }
      } else {
        // New user, continue with onboarding
        nav('/onboarding/profile');
      }
    } catch (error) {
      console.error('Error checking for existing data:', error);
      setRestoreError('Failed to check for existing data. Please try again.');
      setCheckingData(false);
    }
  }, [nav]);

  // Check for existing data when user signs in
  useEffect(() => {
    if (auth.status === 'signed_in' && !checkingData) {
      handleReturningUser();
    }
  }, [auth.status, checkingData, handleReturningUser]);

  const isSigningIn = auth.status === 'signing_in';
  const isCheckingOrSyncing = checkingData || driveSync.status === 'syncing';

  return (
    <div className="card p-6">
      <div className="text-xs font-semibold text-aptum-blue">{onboardingCopy.app.badge}</div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome to Aptum</h1>
      <p className="mt-2 text-muted">{onboardingCopy.app.tagline}</p>
      <p className="mt-4 text-muted">Here your health no longer depletes. Aptum learns your biology to align training, recovery, and nutrition with longevity.</p>
      
      {isCheckingOrSyncing && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-aptum-blue" />
          <span className="text-sm text-gray-700">Checking for existing data...</span>
        </div>
      )}

      {restoreError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {restoreError}
        </div>
      )}

      {auth.status === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {auth.error || 'Google sign-in failed.'}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button 
          className="btn btn-primary flex items-center justify-center gap-2" 
          onClick={signInWithGoogle}
          disabled={isSigningIn || isCheckingOrSyncing}
        >
          {isSigningIn && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </button>
        <button 
          className="btn" 
          onClick={() => nav('/onboarding/profile')}
          disabled={isCheckingOrSyncing}
        >
          Continue without sign-in
        </button>
        <p className="text-xs text-muted text-center">
          Sign in to sync your data across devices and restore your training plan.
        </p>
      </div>
    </div>
  );
}
