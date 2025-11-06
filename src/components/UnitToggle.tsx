import React from 'react';

type Units = 'metric' | 'imperial';

type Props = {
  value: Units;
  onChange: (u: Units) => void;
};

export default function UnitToggle({ value, onChange }: Props) {
  const btn = (u: Units, label: string) => (
    <button
      type="button"
      onClick={() => onChange(u)}
      className={
        'flex-1 rounded-xl px-3 py-2 text-sm transition-colors ' +
        (value === u
          ? 'bg-aptum-blue text-white shadow'
          : 'bg-white text-ink border border-line hover:bg-gray-50')
      }
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-1">
      <span className="text-sm text-muted">Units</span>
      <div className="flex gap-2">
        {btn('metric', 'Metric (kg, cm)')}
        {btn('imperial', 'Imperial (lb, ft·in)')}
      </div>
    </div>
  );
}
