import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  askGoals, 
  loadGoalsInterview, 
  resetGoalsInterview, 
  rebuildPlan,
  slotsComplete,
  type GoalsInterviewState,
  type PlanField,
  type FocusArea,
  type FieldOwnership,
  SUGGESTED_FOCUS_AREAS
} from '@/services/interview';
import { Lock, Unlock, RefreshCw, Plus, X } from 'lucide-react';
import { byok } from '@/services/byok';
import { useState as useLocalState } from 'react';

export default function Goals() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [state, setState] = useState<GoalsInterviewState>({ messages: [], slots: {}, planRecommendation: undefined });
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const hasApiKey = !!byok.get().apiKey;

  useEffect(() => {
    (async () => {
      const s = await loadGoalsInterview();
      setState(s);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length, thinking]);

  // Clear highlights after 15 seconds
  useEffect(() => {
    if (!state.planRecommendation) return;
    
    const hasHighlights = Object.values(state.planRecommendation).some(
      (field) => field && typeof field === 'object' && 'highlight' in field && field.highlight
    );

    if (hasHighlights) {
      const timer = setTimeout(() => {
        const updated = { ...state.planRecommendation };
        Object.keys(updated).forEach((key) => {
          const field = updated[key as keyof typeof updated];
          if (field && typeof field === 'object' && 'highlight' in field) {
            updated[key as keyof typeof updated] = { ...field, highlight: false } as any;
          }
        });
        setState({ ...state, planRecommendation: updated as any });
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [state.planRecommendation]);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    if (!hasApiKey) {
      setState((prev) => ({ 
        ...prev, 
        messages: [...prev.messages, 
          { role: 'user', content: text },
          { role: 'assistant', content: 'API key not configured. Please add your OpenAI API key in the Connect step to use the AI coach.' }
        ] 
      }));
      setInput('');
      return;
    }
    setInput('');
    setThinking(true);
    try {
      const next = await askGoals(state, text);
      setState(next);
    } catch (e: any) {
      setState((prev) => ({ 
        ...prev, 
        messages: [...prev.messages, 
          { role: 'user', content: text },
          { role: 'assistant', content: `Error: ${e?.message || e}` }
        ] 
      }));
    } finally {
      setThinking(false);
    }
  }

  async function handleRebuild() {
    if (!hasApiKey || !state.planRecommendation) return;
    setRebuilding(true);
    try {
      const next = await rebuildPlan(state);
      setState(next);
    } catch (e: any) {
      setState((prev) => ({ 
        ...prev, 
        messages: [...prev.messages, 
          { role: 'assistant', content: `Error rebuilding plan: ${e?.message || e}` }
        ] 
      }));
    } finally {
      setRebuilding(false);
    }
  }

  function updateField(fieldName: keyof NonNullable<typeof state.planRecommendation>, value: any) {
    if (!state.planRecommendation) return;
    const updated = {
      ...state.planRecommendation,
      [fieldName]: {
        ...state.planRecommendation[fieldName],
        value,
        ownership: 'athlete-owned' as FieldOwnership,
        lastUpdated: Date.now(),
        highlight: false,
      }
    };
    setState({ ...state, planRecommendation: updated });
  }

  function toggleLock(fieldName: keyof NonNullable<typeof state.planRecommendation>) {
    if (!state.planRecommendation) return;
    const field = state.planRecommendation[fieldName];
    if (!field) return;
    
    const newOwnership: FieldOwnership = field.ownership === 'locked' 
      ? (field.lastUpdated ? 'athlete-owned' : 'system-owned')
      : 'locked';
    
    const updated = {
      ...state.planRecommendation,
      [fieldName]: { ...field, ownership: newOwnership }
    };
    setState({ ...state, planRecommendation: updated });
  }

  const canContinue = slotsComplete(state.slots);
  const plan = state.planRecommendation;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr,1.2fr]">
      {/* Interview Chat Panel */}
      <div className="card p-4 flex flex-col">
        <h2 className="font-semibold mb-2">Goals Interview</h2>
        <div ref={listRef} className="flex-1 max-h-96 overflow-auto space-y-2 mb-3">
          {loading ? (
            <div className="text-sm text-muted">Loading…</div>
          ) : state.messages.length === 0 ? (
            <div className="text-sm text-muted">Say hi and tell me what you want to achieve. I'll ask brief follow‑ups to understand your goals, availability, equipment, and constraints.</div>
          ) : (
            state.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${m.role === 'user' ? 'bg-aptum-blue text-white' : 'bg-panel border border-line'}`}>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {thinking && <div className="text-sm text-muted animate-pulse">Coach is thinking…</div>}
        </div>
        <div className="flex gap-2">
          <input 
            className="input flex-1" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(); }} 
            placeholder={hasApiKey ? "Type your message…" : "API key required"}
            disabled={!hasApiKey}
          />
          <button className="btn btn-primary" onClick={send} disabled={thinking || !hasApiKey}>
            Send
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="btn btn-sm text-xs" onClick={async () => { await resetGoalsInterview(); const s = await loadGoalsInterview(); setState(s); }}>
            Reset Interview
          </button>
        </div>
      </div>

      {/* Plan Recommendation Panel */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Plan Recommendation</h2>
          {hasApiKey && canContinue && (
            <button 
              className="btn btn-sm flex items-center gap-1.5"
              onClick={handleRebuild}
              disabled={rebuilding}
            >
              <RefreshCw className={`w-4 h-4 ${rebuilding ? 'animate-spin' : ''}`} />
              {rebuilding ? 'Rebuilding...' : 'Rebuild Plan'}
            </button>
          )}
        </div>

        {!hasApiKey ? (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            ⚠️ API key not configured. The plan scaffold below can be edited manually, but AI recommendations require an OpenAI API key.
          </div>
        ) : !canContinue ? (
          <div className="text-sm text-muted">Complete the interview to get AI-powered plan recommendations.</div>
        ) : null}

        {plan && (
          <div className="grid gap-4 mt-4">
            <PlanFieldComponent
              label="Weeks Planned"
              field={plan.weeksPlanned}
              onUpdate={(v) => updateField('weeksPlanned', v)}
              onToggleLock={() => toggleLock('weeksPlanned')}
              type="number"
              min={4}
              max={16}
            />

            <PlanFieldComponent
              label="Sessions Per Week"
              field={plan.sessionsPerWeek}
              onUpdate={(v) => updateField('sessionsPerWeek', v)}
              onToggleLock={() => toggleLock('sessionsPerWeek')}
              type="number"
              min={2}
              max={21}
            />

            <FocusAreasField
              field={plan.focusAreas}
              onUpdate={(v) => updateField('focusAreas', v)}
              onToggleLock={() => toggleLock('focusAreas')}
            />

            <SessionDistributionField
              field={plan.sessionDistribution}
              focusAreas={plan.focusAreas.value || []}
              onUpdate={(v) => updateField('sessionDistribution', v)}
              onToggleLock={() => toggleLock('sessionDistribution')}
            />

            <PlanFieldComponent
              label="Build-to-Deload Ratio"
              field={plan.buildToDeloadRatio}
              onUpdate={(v) => updateField('buildToDeloadRatio', v)}
              onToggleLock={() => toggleLock('buildToDeloadRatio')}
              type="text"
              placeholder="e.g., 3:1"
            />

            <ProgressionTypeField
              field={plan.progressionType}
              onUpdate={(v) => updateField('progressionType', v)}
              onToggleLock={() => toggleLock('progressionType')}
            />

            {plan.startingWeek && (
              <PlanFieldComponent
                label="Starting Week (Optional)"
                field={plan.startingWeek}
                onUpdate={(v) => updateField('startingWeek', v)}
                onToggleLock={() => toggleLock('startingWeek')}
                type="date"
              />
            )}
          </div>
        )}

        <div className="flex gap-2 mt-6 pt-4 border-t border-line">
          <button 
            className="btn btn-primary" 
            disabled={!canContinue} 
            onClick={() => nav('/onboarding/plan', { state: { ...state.slots, plan: state.planRecommendation } })}
          >
            Continue to Plan Generation
          </button>
          <button className="btn" onClick={() => nav('/onboarding/connect')}>Back</button>
        </div>
      </div>
    </div>
  );
}

// Helper component for standard plan fields
function PlanFieldComponent({ 
  label, 
  field, 
  onUpdate, 
  onToggleLock,
  type = 'text',
  min,
  max,
  placeholder
}: { 
  label: string;
  field: PlanField;
  onUpdate: (value: any) => void;
  onToggleLock: () => void;
  type?: 'text' | 'number' | 'date';
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  const isLocked = field.ownership === 'locked';
  const isSystemOwned = field.ownership === 'system-owned';

  return (
    <div className={`grid gap-1.5 transition-all duration-300 ${field.highlight ? 'animate-pulse-once' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isLocked ? 'bg-gray-200 text-gray-700' :
            isSystemOwned ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {isLocked ? 'Locked' : isSystemOwned ? 'AI' : 'You'}
          </span>
        </label>
        <button
          onClick={onToggleLock}
          className="p-1 hover:bg-panel rounded transition-colors"
          title={isLocked ? 'Unlock field' : 'Lock field'}
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      <input
        type={type}
        className={`input ${field.highlight ? 'ring-2 ring-aptum-blue ring-opacity-50' : ''}`}
        value={field.value ?? ''}
        onChange={(e) => onUpdate(type === 'number' ? Number(e.target.value) : e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
      />
    </div>
  );
}

// Component for focus areas (multi-select with custom option)
function FocusAreasField({ field, onUpdate, onToggleLock }: {
  field: PlanField;
  onUpdate: (value: FocusArea[]) => void;
  onToggleLock: () => void;
}) {
  const selected: FocusArea[] = field.value || [];
  const [showCustomInput, setShowCustomInput] = useLocalState(false);
  const [customValue, setCustomValue] = useLocalState('');
  const isLocked = field.ownership === 'locked';
  const isSystemOwned = field.ownership === 'system-owned';

  function toggleArea(area: FocusArea) {
    if (selected.includes(area)) {
      onUpdate(selected.filter(a => a !== area));
    } else if (selected.length < 3) {
      onUpdate([...selected, area]);
    }
  }

  function removeArea(area: FocusArea) {
    onUpdate(selected.filter(a => a !== area));
  }

  function addCustomArea() {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed) && selected.length < 3) {
      onUpdate([...selected, trimmed]);
      setCustomValue('');
      setShowCustomInput(false);
    }
  }

  return (
    <div className={`grid gap-2 transition-all duration-300 ${field.highlight ? 'animate-pulse-once' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          Focus Areas (1-3)
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isLocked ? 'bg-gray-200 text-gray-700' :
            isSystemOwned ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {isLocked ? 'Locked' : isSystemOwned ? 'AI' : 'You'}
          </span>
        </label>
        <button
          onClick={onToggleLock}
          className="p-1 hover:bg-panel rounded transition-colors"
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Selected Focus Areas */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((area) => (
            <div
              key={area}
              className="flex items-center gap-1.5 bg-aptum-blue text-white text-sm px-3 py-1.5 rounded-full"
            >
              <span>{area}</span>
              <button
                onClick={() => removeArea(area)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Focus Areas */}
      <div className={`p-3 rounded-lg border ${field.highlight ? 'ring-2 ring-aptum-blue ring-opacity-50 border-aptum-blue' : 'border-line'}`}>
        <div className="text-xs text-muted mb-2">Suggested:</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUGGESTED_FOCUS_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => toggleArea(area)}
              disabled={selected.includes(area) || selected.length >= 3}
              className={`text-xs px-2 py-1.5 rounded transition-colors ${
                selected.includes(area)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : selected.length >= 3
                  ? 'bg-panel text-gray-400 cursor-not-allowed'
                  : 'bg-panel hover:bg-aptum-blue hover:text-white border border-line'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Custom Focus Area Input */}
        {selected.length < 3 && (
          <div className="mt-3 pt-3 border-t border-line">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="flex items-center gap-1.5 text-xs text-aptum-blue hover:underline"
              >
                <Plus className="w-3 h-3" />
                Add custom focus area
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1 text-sm"
                  placeholder="e.g., Olympic Lifting, Swimming..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCustomArea();
                    if (e.key === 'Escape') {
                      setShowCustomInput(false);
                      setCustomValue('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={addCustomArea}
                  className="btn btn-sm btn-primary"
                  disabled={!customValue.trim()}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomValue('');
                  }}
                  className="btn btn-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-muted">Selected: {selected.length}/3 • You can use suggested areas or create custom ones</div>
    </div>
  );
}

// Component for session distribution
function SessionDistributionField({ field, focusAreas, onUpdate, onToggleLock }: {
  field: PlanField;
  focusAreas: FocusArea[];
  onUpdate: (value: Record<string, number>) => void;
  onToggleLock: () => void;
}) {
  const distribution: Record<string, number> = field.value || {};
  const isLocked = field.ownership === 'locked';
  const isSystemOwned = field.ownership === 'system-owned';

  function updateDistribution(area: FocusArea, value: number) {
    onUpdate({ ...distribution, [area]: value });
  }

  if (focusAreas.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-1.5 transition-all duration-300 ${field.highlight ? 'animate-pulse-once' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          Session Distribution
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isLocked ? 'bg-gray-200 text-gray-700' :
            isSystemOwned ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {isLocked ? 'Locked' : isSystemOwned ? 'AI' : 'You'}
          </span>
        </label>
        <button
          onClick={onToggleLock}
          className="p-1 hover:bg-panel rounded transition-colors"
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      <div className={`grid gap-2 p-3 rounded-lg border ${field.highlight ? 'ring-2 ring-aptum-blue ring-opacity-50 border-aptum-blue' : 'border-line'}`}>
        {focusAreas.map((area) => (
          <div key={area} className="flex items-center gap-2">
            <span className="text-sm flex-1">{area}</span>
            <input
              type="number"
              className="input w-20 text-sm"
              value={distribution[area] || 0}
              onChange={(e) => updateDistribution(area, Number(e.target.value))}
              min={0}
              max={21}
            />
            <span className="text-xs text-muted">sessions/week</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for progression type
function ProgressionTypeField({ field, onUpdate, onToggleLock }: {
  field: PlanField;
  onUpdate: (value: 'linear' | 'periodized') => void;
  onToggleLock: () => void;
}) {
  const value: 'linear' | 'periodized' = field.value || 'linear';
  const isLocked = field.ownership === 'locked';
  const isSystemOwned = field.ownership === 'system-owned';

  return (
    <div className={`grid gap-1.5 transition-all duration-300 ${field.highlight ? 'animate-pulse-once' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          Progression Type
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isLocked ? 'bg-gray-200 text-gray-700' :
            isSystemOwned ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {isLocked ? 'Locked' : isSystemOwned ? 'AI' : 'You'}
          </span>
        </label>
        <button
          onClick={onToggleLock}
          className="p-1 hover:bg-panel rounded transition-colors"
        >
          {isLocked ? <Lock className="w-4 h-4 text-gray-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg border ${field.highlight ? 'ring-2 ring-aptum-blue ring-opacity-50 border-aptum-blue' : 'border-line'}`}>
        <button
          onClick={() => onUpdate('linear')}
          className={`p-3 rounded-lg border-2 transition-all text-left ${
            value === 'linear'
              ? 'border-aptum-blue bg-aptum-blue/5'
              : 'border-line hover:border-gray-300'
          }`}
        >
          <div className="font-semibold text-sm mb-1">Linear</div>
          <div className="text-xs text-muted">
            Beginner-friendly, 4-8 weeks, steady progression
          </div>
        </button>
        <button
          onClick={() => onUpdate('periodized')}
          className={`p-3 rounded-lg border-2 transition-all text-left ${
            value === 'periodized'
              ? 'border-aptum-blue bg-aptum-blue/5'
              : 'border-line hover:border-gray-300'
          }`}
        >
          <div className="font-semibold text-sm mb-1">Periodized</div>
          <div className="text-xs text-muted">
            Advanced models with varied intensities and volumes
          </div>
        </button>
      </div>
    </div>
  );
}
