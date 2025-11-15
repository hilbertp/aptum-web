import { useState, useRef, useEffect } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { PeriodizationModel, PlanField } from '@/schemas/product';
import { MODELS } from '@/services/periodization';
import { getOwnershipBadge, applyPulseAnimation, isHighlightActive } from '@/utils/animations';

interface PeriodizationModelSelectorProps {
  field: PlanField<PeriodizationModel>;
  onModelChange: (model: PeriodizationModel) => void;
  disabled?: boolean;
  showRecommendedBadge?: boolean;
}

/**
 * Dropdown selector for periodization models with info tooltips
 * Shows all 9 models with descriptions and use cases
 */
export function PeriodizationModelSelector({
  field,
  onModelChange,
  disabled,
  showRecommendedBadge
}: PeriodizationModelSelectorProps) {
  const [showInfo, setShowInfo] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const previousHighlight = useRef(field.highlight);

  // Apply pulse animation when field is highlighted by AI
  useEffect(() => {
    if (field.highlight && !previousHighlight.current && fieldRef.current) {
      applyPulseAnimation(fieldRef.current);
    }
    previousHighlight.current = field.highlight;
  }, [field.highlight]);

  const isLocked = field.ownership === 'locked';
  const isHighlighted = field.highlight && isHighlightActive(field.highlightUntil);
  const badge = getOwnershipBadge(field.ownership);
  const currentModel = field.value;
  const currentModelDef = MODELS[currentModel];

  return (
    <div
      ref={fieldRef}
      className={`grid gap-2 transition-all duration-300 ${isHighlighted ? 'animate-pulse-subtle' : ''}`}
    >
      {/* Label and ownership badge */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          Periodization Model
          <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>{badge.text}</span>
          {showRecommendedBadge && field.modifiedBy === 'ai' && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">AI Recommended</span>
          )}
        </label>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1 hover:bg-panel rounded transition-colors"
          title="Show model information"
        >
          <Info className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Model selector dropdown */}
      <div className="relative">
        <select
          className={`input w-full pr-8 appearance-none ${isHighlighted ? 'ring-2 ring-yellow-300 ring-opacity-50 bg-yellow-50' : ''}`}
          value={currentModel}
          onChange={(e) => onModelChange(e.target.value as PeriodizationModel)}
          disabled={isLocked || disabled}
        >
          {(Object.keys(MODELS) as PeriodizationModel[]).map((modelKey) => {
            const modelDef = MODELS[modelKey];
            return (
              <option key={modelKey} value={modelKey}>
                {modelDef.name}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Current model info card */}
      <div className={`p-3 rounded-lg border ${isHighlighted ? 'border-yellow-300 bg-yellow-50' : 'border-line bg-panel'}`}>
        <div className="text-sm font-medium mb-1">{currentModelDef.name}</div>
        <div className="text-xs text-muted mb-2">{currentModelDef.description}</div>
        <div className="text-xs text-muted">
          <strong>Best for:</strong> {currentModelDef.bestFor.join(', ')}
        </div>
      </div>

      {/* Expanded info panel (all models) */}
      {showInfo && (
        <div className="grid gap-2 p-3 rounded-lg border border-aptum-blue bg-blue-50 max-h-96 overflow-y-auto">
          <div className="font-medium text-sm mb-2">All Periodization Models</div>
          {(Object.keys(MODELS) as PeriodizationModel[]).map((modelKey) => {
            const modelDef = MODELS[modelKey];
            const isSelected = modelKey === currentModel;
            return (
              <div
                key={modelKey}
                className={`p-2 rounded border transition-colors ${
                  isSelected ? 'bg-aptum-blue text-white border-aptum-blue' : 'bg-white border-line'
                }`}
              >
                <div className="text-sm font-medium mb-0.5">{modelDef.name}</div>
                <div className={`text-xs mb-1 ${isSelected ? 'text-white/90' : 'text-muted'}`}>
                  {modelDef.description}
                </div>
                <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted'}`}>
                  <strong>Best for:</strong> {modelDef.bestFor.join(', ')}
                </div>
                {modelDef.constraints.minWeeks && (
                  <div className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-muted'}`}>
                    <strong>Duration:</strong> {modelDef.constraints.minWeeks}-{modelDef.constraints.maxWeeks || '∞'} weeks
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact model selector without info panel (for constrained spaces)
 */
export function CompactModelSelector({
  field,
  onModelChange,
  disabled
}: PeriodizationModelSelectorProps) {
  const currentModel = field.value;
  const isLocked = field.ownership === 'locked';

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Model:</label>
      <select
        className="input flex-1"
        value={currentModel}
        onChange={(e) => onModelChange(e.target.value as PeriodizationModel)}
        disabled={isLocked || disabled}
      >
        {(Object.keys(MODELS) as PeriodizationModel[]).map((modelKey) => {
          const modelDef = MODELS[modelKey];
          return (
            <option key={modelKey} value={modelKey}>
              {modelDef.name}
            </option>
          );
        })}
      </select>
    </div>
  );
}
