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
import { NumberField, TextField, DeloadRatioField } from '@/components/mesocycle/PlanField';
import { PeriodizationModelSelector } from '@/components/mesocycle/PeriodizationModelSelector';
import { Lock, Unlock, RefreshCw, Plus, X } from 'lucide-react';
import { byok } from '@/services/byok';
import { useState as useLocalState } from 'react';
import type { PeriodizationModel } from '@/schemas/product';

// Adapter to convert interview PlanField to EnhancedPlan PlanField format for components
function adaptPlanField<T>(interviewField: PlanField): {
  value: T;
  ownership: 'system' | 'athlete' | 'locked';
  lastModified: number;
  modifiedBy: 'ai' | 'athlete';
  highlight: boolean;
  highlightUntil?: number;
} {
  const ownership = 
    interviewField.ownership === 'system-owned' ? 'system' :
    interviewField.ownership === 'athlete-owned' ? 'athlete' :
    'locked';
  
  return {
    value: interviewField.value as T,
    ownership,
    lastModified: interviewField.lastUpdated || Date.now(),
    modifiedBy: ownership === 'athlete' ? 'athlete' : 'ai',
    highlight: interviewField.highlight || false,
    highlightUntil: interviewField.highlight ? Date.now() + 15000 : undefined
  };
}

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
        setState((prevState) => {
          if (!prevState.planRecommendation) return prevState;
          const updated = { ...prevState.planRecommendation };
          Object.keys(updated).forEach((key) => {
            const field = updated[key as keyof typeof updated];
            if (field && typeof field === 'object' && 'highlight' in field) {
              updated[key as keyof typeof updated] = { ...field, highlight: false } as any;
            }
          });
          return { ...prevState, planRecommendation: updated as any };
        });
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
    
    // If progressionType changes to 'periodized', initialize periodizationModel if not present
    if (fieldName === 'progressionType' && value === 'periodized' && !updated.periodizationModel) {
      updated.periodizationModel = {
        value: 'classical_linear',
        ownership: 'system-owned' as FieldOwnership,
        lastUpdated: Date.now(),
        highlight: false,
      };
    }
    
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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Plan Recommendation</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure your training mesocycle</p>
          </div>
          {hasApiKey && canContinue && (
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={handleRebuild}
              disabled={rebuilding}
            >
              <RefreshCw className={`w-4 h-4 ${rebuilding ? 'animate-spin' : ''}`} />
              {rebuilding ? 'Rebuilding...' : 'Rebuild Plan'}
            </button>
          )}
        </div>

        {!hasApiKey ? (
          <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
            ⚠️ <span className="font-medium">API key not configured.</span> You can edit the plan manually, but AI recommendations require an OpenAI API key.
          </div>
        ) : !canContinue ? (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">Complete the interview to get AI-powered plan recommendations.</div>
        ) : null}

        {plan && (
          <div className="space-y-6">
            {/* Basic Settings - 3 columns for compact layout */}
            <div className="grid grid-cols-3 gap-4">
              <NumberField
                label="Weeks Planned"
                field={adaptPlanField<number>(plan.weeksPlanned)}
                onValueChange={(v) => updateField('weeksPlanned', v)}
                onLockToggle={() => toggleLock('weeksPlanned')}
                min={4}
                max={16}
                compact={true}
              />

              <NumberField
                label="Sessions Per Week"
                field={adaptPlanField<number>(plan.sessionsPerWeek)}
                onValueChange={(v) => updateField('sessionsPerWeek', v)}
                onLockToggle={() => toggleLock('sessionsPerWeek')}
                min={2}
                max={21}
                compact={true}
              />

              <DeloadRatioField
                label="Build-to-Deload Ratio"
                field={adaptPlanField<string>(plan.buildToDeloadRatio)}
                onValueChange={(v) => updateField('buildToDeloadRatio', v)}
                onLockToggle={() => toggleLock('buildToDeloadRatio')}
              />
            </div>

            <div className="border-t border-gray-100"></div>

            <FocusAreasField
              field={plan.focusAreas}
              onUpdate={(v) => updateField('focusAreas', v)}
              onToggleLock={() => toggleLock('focusAreas')}
            />

            {(plan.focusAreas.value || []).length > 0 && (
              <SessionDistributionField
                field={plan.sessionDistribution}
                focusAreas={plan.focusAreas.value || []}
                onUpdate={(v) => updateField('sessionDistribution', v)}
                onToggleLock={() => toggleLock('sessionDistribution')}
              />
            )}

            <div className="border-t border-gray-100"></div>

            <ProgressionTypeField
              field={plan.progressionType}
              onUpdate={(v) => updateField('progressionType', v)}
              onToggleLock={() => toggleLock('progressionType')}
            />

            {plan.progressionType.value === 'periodized' && plan.periodizationModel && (
              <PeriodizationModelSelector
                field={adaptPlanField<PeriodizationModel>(plan.periodizationModel)}
                onModelChange={(model) => updateField('periodizationModel', model)}
                showRecommendedBadge={plan.periodizationModel.ownership === 'system-owned'}
              />
            )}

            {plan.startingWeek && (
              <TextField
                label="Starting Week (Optional)"
                field={adaptPlanField<string>(plan.startingWeek)}
                onValueChange={(v) => updateField('startingWeek', v)}
                onLockToggle={() => toggleLock('startingWeek')}
              />
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
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
    <div className={`space-y-2 transition-all duration-300 ${field.highlight ? 'animate-pulse-once' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-900">Focus Areas</label>
          <div className="text-xs text-gray-500 mt-0.5">Select 1-3 training goals</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isLocked ? 'bg-gray-100 text-gray-600' :
            isSystemOwned ? 'bg-blue-50 text-blue-600' :
            'bg-green-50 text-green-600'
          }`}>
            {isLocked ? 'Locked' : isSystemOwned ? 'AI' : 'You'}
          </span>
          <button
            onClick={onToggleLock}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isLocked ? <Lock className="w-4 h-4 text-gray-400" /> : <Unlock className="w-4 h-4 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Focus Area Chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_FOCUS_AREAS.map((area) => {
          const isSelected = selected.includes(area);
          return (
            <button
              key={area}
              onClick={() => toggleArea(area)}
              disabled={selected.length >= 3 && !isSelected}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-aptum-blue text-white shadow-sm'
                  : selected.length >= 3
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-aptum-blue hover:text-aptum-blue hover:shadow-sm'
              }`}
            >
              {area}
            </button>
          );
        })}
        
        {/* Custom focus area button/input */}
        {selected.length < 3 && !showCustomInput && (
          <button
            onClick={() => setShowCustomInput(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-dashed border-gray-300 text-gray-500 hover:border-aptum-blue hover:text-aptum-blue transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Custom
          </button>
        )}
        
        {showCustomInput && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              className="input-compact text-sm w-40"
              placeholder="Custom area..."
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
              className="px-3 py-1 bg-aptum-blue text-white text-sm rounded hover:bg-aptum-blue/90"
              disabled={!customValue.trim()}
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowCustomInput(false);
                setCustomValue('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
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
    <div className={`space-y-2 transition-all duration-300 ${field.highlight ? 'animate-pulse-once' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-900">Session Distribution</label>
          <div className="text-xs text-gray-500 mt-0.5">Sessions per week per focus area</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isLocked ? 'bg-gray-100 text-gray-600' :
            isSystemOwned ? 'bg-blue-50 text-blue-600' :
            'bg-green-50 text-green-600'
          }`}>
            {isLocked ? 'Locked' : isSystemOwned ? 'AI' : 'You'}
          </span>
          <button
            onClick={onToggleLock}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isLocked ? <Lock className="w-4 h-4 text-gray-400" /> : <Unlock className="w-4 h-4 text-gray-300" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {focusAreas.map((area) => (
          <div key={area} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium text-gray-700 flex-1">{area}</span>
            <input
              type="number"
              className="input-compact w-20 text-center font-medium"
              value={distribution[area] || 0}
              onChange={(e) => updateDistribution(area, Number(e.target.value))}
              min={0}
              max={21}
            />
            <span className="text-xs text-gray-500">sessions/wk</span>
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
    <div className={`space-y-2 transition-all duration-300 ${field.highlight ? 'animate-pulse-once' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-900">Progression Type</label>
          <div className="text-xs text-gray-500 mt-0.5">How intensity and volume progress over time</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isLocked ? 'bg-gray-100 text-gray-600' :
            isSystemOwned ? 'bg-blue-50 text-blue-600' :
            'bg-green-50 text-green-600'
          }`}>
            {isLocked ? 'Locked' : isSystemOwned ? 'AI' : 'You'}
          </span>
          <button
            onClick={onToggleLock}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isLocked ? <Lock className="w-4 h-4 text-gray-400" /> : <Unlock className="w-4 h-4 text-gray-300" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onUpdate('linear')}
          className={`p-3 rounded-lg border-2 transition-all text-left ${
            value === 'linear'
              ? 'border-aptum-blue bg-aptum-blue/5 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="font-semibold text-sm text-gray-900 mb-1">Linear</div>
          <div className="text-xs text-gray-600 leading-relaxed">
            Beginner-friendly, steady progression
          </div>
        </button>
        <button
          onClick={() => onUpdate('periodized')}
          className={`p-3 rounded-lg border-2 transition-all text-left ${
            value === 'periodized'
              ? 'border-aptum-blue bg-aptum-blue/5 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="font-semibold text-sm text-gray-900 mb-1">Periodized</div>
          <div className="text-xs text-gray-600 leading-relaxed">
            Advanced models with phases
          </div>
        </button>
      </div>
    </div>
  );
}
