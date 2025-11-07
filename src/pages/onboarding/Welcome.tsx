import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white via-white to-aptum-blue/5 p-8">
      <div className="relative grid gap-3">
        <div className="text-xs font-semibold tracking-widest text-aptum-blue">APTUM</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Welcome to Aptum</h1>
        <h2 className="text-lg font-medium text-ink/90">Your system for an intelligent life.</h2>
        <p className="max-w-2xl text-ink/80">
          Here your health no longer depletes. Aptum learns your biology to align training, recovery, and nutrition with longevity.
        </p>
        <div className="mt-4">
          <Link to="/onboarding/profile" className="btn btn-primary">Begin</Link>
        </div>
      </div>
    </div>
  );
}
