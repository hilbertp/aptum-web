import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const nav = useNavigate();
  return (
    <div className="relative">
      <div className="mx-auto max-w-3xl">
        <div className="min-h-[50vh] rounded-2xl bg-gradient-to-b from-[#f9f9fb] to-[#f2f3f5] p-8 md:p-12 flex items-center justify-center text-center">
          <div className="max-w-xl">
            <div className="font-semibold text-aptum-blue tracking-wide mb-3">APTUM</div>
            <h1 className="text-2xl font-semibold mb-2">Welcome to Aptum</h1>
            <h2 className="text-lg font-normal mb-3">Your system for an intelligent life.</h2>
            <p className="text-base text-muted mb-6">Here your health no longer depletes. Aptum learns your biology to align training, recovery, and nutrition with longevity.</p>
            <button className="btn btn-primary rounded-xl px-6 py-3" onClick={()=>nav('/onboarding/profile')}>Begin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
