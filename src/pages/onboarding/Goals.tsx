import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Goals() {
  const nav = useNavigate();
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'fat loss' | 'endurance' | 'mixed'>('strength');
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState('full gym');
  const [constraints, setConstraints] = useState('');

  return (
    <div className="card p-4 grid gap-3">
      <h2 className="font-semibold">Goals Interview</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Primary Goal</span>
          <select className="input" value={goal} onChange={(e) => setGoal(e.target.value as any)}>
            <option value="hypertrophy">Hypertrophy</option>
            <option value="strength">Strength</option>
            <option value="fat loss">Fat loss</option>
            <option value="endurance">Endurance</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Days / week</span>
          <input className="input" type="number" min={2} max={7} value={days} onChange={(e) => setDays(Number(e.target.value) || 2)} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Equipment</span>
          <input className="input" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-sm">Constraints / injuries (optional)</span>
        <input className="input" value={constraints} onChange={(e) => setConstraints(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => nav('/onboarding/plan', { state: { goal, days, equipment, constraints } })}>Continue</button>
        <button className="btn" onClick={() => nav('/onboarding/profile')}>Back</button>
      </div>
    </div>
  );
}
