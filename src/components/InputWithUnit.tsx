import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  unit?: string;
  label?: string;
  error?: string;
};

export default function InputWithUnit({ unit, label, error, className, ...rest }: Props) {
  return (
    <label className="grid gap-1">
      {label && <span className="text-sm text-muted">{label}</span>}
      <div className="relative">
        <input
          {...rest}
          className={
            'border rounded px-3 py-2 w-full pr-10 ' +
            (className ? className : '')
          }
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm select-none">
            {unit}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
