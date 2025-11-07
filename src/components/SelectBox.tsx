import React from 'react';

type Props = {
  label?: string;
  value: string | number | readonly string[] | undefined;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
};

export default function SelectBox({ label, value, onChange, children }: Props) {
  return (
    <label className="grid gap-1">
      {label && <span className="text-sm text-muted">{label}</span>}
      <select
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
        value={value as any}
        onChange={onChange}
      >
        {children}
      </select>
    </label>
  );
}
