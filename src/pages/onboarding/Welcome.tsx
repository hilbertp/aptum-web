import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const nav = useNavigate();
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Welcome to Aptum</h1>
      <p className="text-base">…where health no longer depletes. Aptum learns your biology to align training, recovery, and nutrition with longevity.</p>
      <p className="text-base">Your operating system for longevity.</p>
      <div>
        <button className="btn btn-primary" onClick={()=>nav('/onboarding/profile')}>Begin your intelligent life</button>
      </div>
    </div>
  );
}
