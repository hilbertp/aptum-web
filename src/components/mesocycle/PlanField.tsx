import { useEffect, useRef } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { PlanField as PlanFieldType } from '@/schemas/product';
import {
  getOwnershipBadge,
  highlightClasses,
  applyPulseAnimation,
  isHighlightActive
} from '@/utils/animations';

interface BaseFieldProps {
  label: string;
  onLockToggle: () => void;
  disabled?: boolean;
  helpText?: string;
}

/** Common wrapper for field UI with ownership badge and lock button */
function FieldWrapper({
  children,
  label,
  field,
  onLockToggle,
  helpText
}: {
  children: React.ReactNode;
  label: string;
  field: PlanFieldType<any>;
  onLockToggle: () => void;
  helpText?: string;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const previousHighlight = useRef(field.highlight);

  useEffect(() => {
    if (field.highlight && !previousHighlight.current && fieldRef.current) {
      applyPulseAnimation(fieldRef.current);
    }
    previousHighlight.current = field.highlight;
  }, [field.highlight]);

  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const badge = getOwnershipBadge(field.ownership);

  return (
    <div
      ref={fieldRef}
      className={`grid gap-1.5 transition-all duration-300 ${isHighlighted ? 'animate-pulse-subtle' : ''}`}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>{badge.text}</span>
        </label>
        <button
          onClick={onLockToggle}
          className="p-1 hover:bg-panel rounded transition-colors"
          title={isLocked ? 'Unlock field' : 'Lock field'}
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      {children}
      {helpText && <div className="text-xs text-muted">{helpText}</div>}
    </div>
  );
}

/** Number input field */
export function NumberField({
  label,
  field,
  onValueChange,
  onLockToggle,
  min,
  max,
  step,
  disabled,
  helpText,
  compact = false
}: BaseFieldProps & {
  field: PlanFieldType<number>;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  compact?: boolean;
}) {
  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const inputClasses = `${compact ? 'input-compact' : 'input'} transition-all ${isHighlighted ? highlightClasses : ''}`;

  return (
    <FieldWrapper label={label} field={field} onLockToggle={onLockToggle} helpText={helpText}>
      <input
        type="number"
        className={inputClasses}
        value={field.value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={isLocked || disabled}
      />
    </FieldWrapper>
  );
}

/** Text input field */
export function TextField({
  label,
  field,
  onValueChange,
  onLockToggle,
  placeholder,
  disabled,
  helpText
}: BaseFieldProps & {
  field: PlanFieldType<string>;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) {
  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const inputClasses = `input transition-all ${isHighlighted ? highlightClasses : ''}`;

  return (
    <FieldWrapper label={label} field={field} onLockToggle={onLockToggle} helpText={helpText}>
      <input
        type="text"
        className={inputClasses}
        value={field.value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        disabled={isLocked || disabled}
      />
    </FieldWrapper>
  );
}

/** Select dropdown field */
export function SelectField<T extends string | number>({
  label,
  field,
  onValueChange,
  onLockToggle,
  options,
  disabled,
  helpText
}: BaseFieldProps & {
  field: PlanFieldType<T>;
  onValueChange: (value: T) => void;
  options: Array<{ value: T; label: string; description?: string }>;
}) {
  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const inputClasses = `input transition-all ${isHighlighted ? highlightClasses : ''}`;

  return (
    <FieldWrapper label={label} field={field} onLockToggle={onLockToggle} helpText={helpText}>
      <select
        className={inputClasses}
        value={String(field.value)}
        onChange={(e) => {
          const selectedOption = options.find((opt) => String(opt.value) === e.target.value);
          if (selectedOption) {
            onValueChange(selectedOption.value);
          }
        }}
        disabled={isLocked || disabled}
      >
        {options.map((option, idx) => (
          <option key={idx} value={String(option.value)} title={option.description}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

/** Multi-select field with chips */
export function MultiSelectField({
  label,
  field,
  onValueChange,
  onLockToggle,
  options,
  maxSelections = 10,
  disabled,
  helpText
}: BaseFieldProps & {
  field: PlanFieldType<string[]>;
  onValueChange: (value: string[]) => void;
  options: string[];
  maxSelections?: number;
}) {
  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const selected = field.value || [];

  const toggleSelection = (option: string) => {
    if (isLocked || disabled) return;

    if (selected.includes(option)) {
      onValueChange(selected.filter((s) => s !== option));
    } else if (selected.length < maxSelections) {
      onValueChange([...selected, option]);
    }
  };

  return (
    <FieldWrapper label={label} field={field} onLockToggle={onLockToggle} helpText={helpText}>
      <div className={`p-3 rounded-lg border ${isHighlighted ? highlightClasses : 'border-line'}`}>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => toggleSelection(option)}
                disabled={isLocked || disabled || (!isSelected && selected.length >= maxSelections)}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  isSelected
                    ? 'bg-aptum-blue text-white'
                    : selected.length >= maxSelections
                      ? 'bg-panel text-gray-400 cursor-not-allowed'
                      : 'bg-panel hover:bg-gray-200 border border-line'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-muted mt-2">
          Selected: {selected.length}/{maxSelections}
        </div>
      </div>
    </FieldWrapper>
  );
}

/**
 * Specialized component for phase lengths (used in block periodization)
 */
export function PhaseLengthsField(props: {
  label: string;
  field: PlanFieldType<number[]>;
  phaseNames: string[];
  onValueChange: (newValue: number[]) => void;
  onLockToggle: () => void;
  disabled?: boolean;
}) {
  const { label, field, phaseNames, onValueChange, onLockToggle, disabled } = props;
  const fieldRef = useRef<HTMLDivElement>(null);
  const previousHighlight = useRef(field.highlight);

  useEffect(() => {
    if (field.highlight && !previousHighlight.current && fieldRef.current) {
      applyPulseAnimation(fieldRef.current);
    }
    previousHighlight.current = field.highlight;
  }, [field.highlight]);

  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const badge = getOwnershipBadge(field.ownership);
  const phaseLengths = field.value || [];

  const updatePhaseLength = (index: number, value: number) => {
    const updated = [...phaseLengths];
    updated[index] = value;
    onValueChange(updated);
  };

  const totalWeeks = phaseLengths.reduce((sum, weeks) => sum + weeks, 0);

  return (
    <div
      ref={fieldRef}
      className={`grid gap-1.5 transition-all duration-300 ${isHighlighted ? 'animate-pulse-subtle' : ''}`}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>{badge.text}</span>
        </label>
        <button
          onClick={onLockToggle}
          className="p-1 hover:bg-panel rounded transition-colors"
          title={isLocked ? 'Unlock field' : 'Lock field'}
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      <div className={`grid gap-2 p-3 rounded-lg border ${isHighlighted ? highlightClasses : 'border-line'}`}>
        {phaseNames.map((phaseName, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm flex-1">{phaseName}</span>
            <input
              type="number"
              className="input w-20 text-sm"
              value={phaseLengths[index] || 0}
              onChange={(e) => updatePhaseLength(index, Number(e.target.value))}
              min={1}
              max={20}
              disabled={isLocked || disabled}
            />
            <span className="text-xs text-muted">weeks</span>
          </div>
        ))}
        <div className="text-xs text-muted pt-2 border-t border-line">Total: {totalWeeks} weeks</div>
      </div>
    </div>
  );
}

/**
 * Specialized component for deload ratio (e.g., "3:1", "4:1")
 * Shows only the build weeks input with ":1" suffix
 */
export function DeloadRatioField(props: {
  label: string;
  field: PlanFieldType<string>;
  onValueChange: (newValue: string) => void;
  onLockToggle: () => void;
  disabled?: boolean;
  helpText?: string;
}) {
  const { label, field, onValueChange, onLockToggle, disabled, helpText } = props;
  const fieldRef = useRef<HTMLDivElement>(null);
  const previousHighlight = useRef(field.highlight);

  useEffect(() => {
    if (field.highlight && !previousHighlight.current && fieldRef.current) {
      applyPulseAnimation(fieldRef.current);
    }
    previousHighlight.current = field.highlight;
  }, [field.highlight]);

  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const badge = getOwnershipBadge(field.ownership);

  // Parse current value (e.g., "3:1" -> 3)
  const currentValue = field.value || '3:1';
  const buildWeeks = parseInt(currentValue.split(':')[0] || '3', 10);

  const handleChange = (weeks: number) => {
    const newRatio = `${weeks}:1`;
    onValueChange(newRatio);
  };

  return (
    <div
      ref={fieldRef}
      className={`grid gap-1.5 transition-all duration-300 ${isHighlighted ? 'animate-pulse-subtle' : ''}`}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>{badge.text}</span>
        </label>
        <button
          onClick={onLockToggle}
          className="p-1 hover:bg-panel rounded transition-colors"
          title={isLocked ? 'Unlock field' : 'Lock field'}
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          className={`input-compact w-20 ${isHighlighted ? highlightClasses : ''}`}
          value={buildWeeks}
          onChange={(e) => handleChange(Number(e.target.value) || 3)}
          min={2}
          max={6}
          disabled={isLocked || disabled}
        />
        <span className="text-sm text-muted font-medium">:1</span>
        <span className="text-xs text-muted">(weeks build : weeks deload)</span>
      </div>
      
      {helpText && <div className="text-xs text-muted">{helpText}</div>}
    </div>
  );
}

/**
 * Specialized component for intensity distribution (used in polarized training)
 */
export function IntensityDistributionField(props: {
  label: string;
  field: PlanFieldType<{ low: number; moderate: number; high: number }>;
  onValueChange: (newValue: { low: number; moderate: number; high: number }) => void;
  onLockToggle: () => void;
  disabled?: boolean;
}) {
  const { label, field, onValueChange, onLockToggle, disabled } = props;
  const fieldRef = useRef<HTMLDivElement>(null);
  const previousHighlight = useRef(field.highlight);

  useEffect(() => {
    if (field.highlight && !previousHighlight.current && fieldRef.current) {
      applyPulseAnimation(fieldRef.current);
    }
    previousHighlight.current = field.highlight;
  }, [field.highlight]);

  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const badge = getOwnershipBadge(field.ownership);
  const distribution = field.value || { low: 75, moderate: 5, high: 20 };

  const updateDistribution = (key: 'low' | 'moderate' | 'high', value: number) => {
    onValueChange({ ...distribution, [key]: value });
  };

  const total = distribution.low + distribution.moderate + distribution.high;
  const isValid = Math.abs(total - 100) < 1;

  return (
    <div
      ref={fieldRef}
      className={`grid gap-1.5 transition-all duration-300 ${isHighlighted ? 'animate-pulse-subtle' : ''}`}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>{badge.text}</span>
        </label>
        <button
          onClick={onLockToggle}
          className="p-1 hover:bg-panel rounded transition-colors"
          title={isLocked ? 'Unlock field' : 'Lock field'}
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      <div className={`grid gap-2 p-3 rounded-lg border ${isHighlighted ? highlightClasses : 'border-line'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Low Intensity</span>
          <input
            type="number"
            className="input w-20 text-sm"
            value={distribution.low}
            onChange={(e) => updateDistribution('low', Number(e.target.value))}
            min={0}
            max={100}
            disabled={isLocked || disabled}
          />
          <span className="text-xs text-muted">%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">Moderate Intensity</span>
          <input
            type="number"
            className="input w-20 text-sm"
            value={distribution.moderate}
            onChange={(e) => updateDistribution('moderate', Number(e.target.value))}
            min={0}
            max={100}
            disabled={isLocked || disabled}
          />
          <span className="text-xs text-muted">%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm flex-1">High Intensity</span>
          <input
            type="number"
            className="input w-20 text-sm"
            value={distribution.high}
            onChange={(e) => updateDistribution('high', Number(e.target.value))}
            min={0}
            max={100}
            disabled={isLocked || disabled}
          />
          <span className="text-xs text-muted">%</span>
        </div>
        <div className={`text-xs pt-2 border-t border-line ${isValid ? 'text-muted' : 'text-red-500'}`}>
          Total: {total}% {!isValid && '(must equal 100%)'}
        </div>
      </div>
    </div>
  );
}
