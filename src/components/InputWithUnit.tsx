import React from 'react';

type Props = {
  label?: string;
  unit?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  value: string | number | undefined | '';
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  min?: number;
  max?: number;
  step?: number | string;
};

export default function InputWithUnit({ label, unit, type = 'text', placeholder, value, onChange, min, max, step }: Props) {
  return (
    <label className="grid gap-1">
      {label && <span className="text-sm text-muted">{label}</span>}
      <div className="relative">
        <input
          className="w-full rounded-xl border border-line bg-white px-3 py-2 pr-12"
          type={type}
          placeholder={placeholder}
          value={value as any}
          onChange={onChange}
          min={min}
          max={max}
          step={step as any}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}
