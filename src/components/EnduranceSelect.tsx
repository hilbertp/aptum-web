import React from 'react';

type Sex = 'male' | 'female' | 'other';

type Vo2Range = { male: [number | null, number | null]; female: [number | null, number | null] };

export type EnduranceLevelKey = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';

export type EnduranceSelection = {
  level: EnduranceLevelKey;
  vo2Range: Vo2Range;
};

const ENDURANCE_LEVELS: Record<EnduranceLevelKey, { label: EnduranceLevelKey; desc: string; range: Vo2Range }> = {
  Beginner: {
    label: 'Beginner',
    desc: 'Little or no structured cardio — VO₂max < 35 (men) / < 30 (women)',
    range: { male: [null, 35], female: [null, 30] }
  },
  Intermediate: {
    label: 'Intermediate',
    desc: 'Regular aerobic exercise — VO₂max ≈ 35–45 (men) / 30–40 (women)',
    range: { male: [35, 45], female: [30, 40] }
  },
  Advanced: {
    label: 'Advanced',
    desc: 'High endurance base — VO₂max ≈ 45–55 (men) / 40–50 (women)',
    range: { male: [45, 55], female: [40, 50] }
  },
  Elite: {
    label: 'Elite',
    desc: 'Competitive endurance — VO₂max > 55 (men) / > 50 (women)',
    range: { male: [55, null], female: [50, null] }
  }
};

// Helper to map a wearable VO2max to a level (sex-aware)
function inferLevelFromVo2(vo2: number, sex: Sex): EnduranceLevelKey {
  const v = vo2;
  if (sex === 'female') {
    if (v < 30) return 'Beginner';
    if (v < 40) return 'Intermediate';
    if (v < 50) return 'Advanced';
    return 'Elite';
  } else {
    // default to male thresholds for male/other
    if (v < 35) return 'Beginner';
    if (v < 45) return 'Intermediate';
    if (v < 55) return 'Advanced';
    return 'Elite';
  }
}

type Props = {
  sex: Sex; // used for wearable prefill logic
  wearableVo2?: number; // optional VO2max (mL/kg/min) from health data
  value?: EnduranceSelection; // controlled value (optional)
  onChange?: (val: EnduranceSelection) => void;
  disabled?: boolean;
};

export default function EnduranceSelect({ sex, wearableVo2, value, onChange, disabled }: Props) {
  const [internal, setInternal] = React.useState<EnduranceSelection>(
    value || { level: 'Intermediate', vo2Range: ENDURANCE_LEVELS['Intermediate'].range }
  );

  // Prefill from wearable VO2max (only if parent hasn't provided a controlled value)
  React.useEffect(() => {
    if (wearableVo2 && !value) {
      const lvl = inferLevelFromVo2(wearableVo2, sex);
      const next = { level: lvl, vo2Range: ENDURANCE_LEVELS[lvl].range };
      setInternal(next);
      onChange?.(next);
    }
  }, [wearableVo2, sex, value, onChange]);

  // Keep internal state in sync if parent controls value
  React.useEffect(() => {
    if (value) setInternal(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lvl = e.target.value as EnduranceLevelKey;
    const next = { level: lvl, vo2Range: ENDURANCE_LEVELS[lvl].range };
    if (value) {
      // controlled
      onChange?.(next);
    } else {
      setInternal(next);
      onChange?.(next);
    }
  };

  const currentMeta = ENDURANCE_LEVELS[internal.level];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-gray-800">Endurance Level</label>
        <span
          className="cursor-help text-gray-500"
          title={
            'These levels are anchored to VO₂max norms (mL/kg/min), a key indicator of aerobic capacity. ' +
            'If you connect a wearable, we can prefill this from your measured VO₂max.'
          }
          aria-label="VO2 info"
        >
          ⓘ
        </span>
      </div>

      <select
        className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink shadow-sm focus:border-aptum-blue focus:outline-none focus:ring-1 focus:ring-aptum-blue disabled:opacity-60"
        value={internal.level}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby="endurance-hint"
      >
        {Object.values(ENDURANCE_LEVELS).map((opt) => (
          <option key={opt.label} value={opt.label}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* helper under the field */}
      <p id="endurance-hint" className="mt-1 text-sm text-muted">
        {currentMeta.desc}
      </p>
    </div>
  );
}
