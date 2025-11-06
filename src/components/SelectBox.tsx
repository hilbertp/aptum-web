import React from 'react';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export default function SelectBox({ label, children, className, ...rest }: Props) {
  return (
    <label className="grid gap-1">
      {label && <span className="text-sm text-muted">{label}</span>}
      <div className="relative">
        <select
          {...rest}
          className={
            'appearance-none w-full rounded-xl border border-line bg-white px-3 py-2 pr-9 text-base text-ink shadow-sm focus:border-aptum-blue focus:outline-none focus:ring-1 focus:ring-aptum-blue ' +
            (className || '')
          }
        >
          {children}
        </select>
        {/* caret */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
      </div>
    </label>
  );
}
