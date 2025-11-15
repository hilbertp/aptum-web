import { useEffect, useState } from 'react';
import { loadPlan, loadProfile, reviewCurrentStrategy, type StrategyReview } from '@/services/coach';
import type { Plan, EnhancedPlan, PeriodizationModel, Profile } from '@/schemas/product';
import { put, get } from '@/services/storage';
import { NumberField, DeloadRatioField } from '@/components/mesocycle/PlanField';
import { PeriodizationModelSelector } from '@/components/mesocycle/PeriodizationModelSelector';
import { createPlanField } from '@/services/planEngine';
import { AlertCircle, CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react';
import { byok } from '@/services/byok';

export default function Strategy() {
  const [plan, setPlan] = useState<Partial<EnhancedPlan> | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<StrategyReview | null>(null);
  const hasApiKey = !!byok.get().apiKey;

  useEffect(() => {
    (async () => {
      // Load profile
      const userProfile = await loadProfile();
      setProfile(userProfile || null);

      // Try to load enhanced plan first, fallback to basic plan
      let enhancedPlan = await get<Partial<EnhancedPlan>>('plan', 'enhanced');
      if (!enhancedPlan) {
        const basicPlan = await loadPlan();
        if (basicPlan) {
          // Convert basic plan to enhanced plan structure
          enhancedPlan = {
            ...basicPlan,
            weeksPlanned: createPlanField(basicPlan.cycle.weeks),
            sessionsPerWeek: createPlanField(4),
            focusAreas: createPlanField([]),
            buildToDeloadRatio: createPlanField('3:1'),
            periodizationModel: createPlanField<PeriodizationModel>('classical_linear')
          };
        }
      }
      setPlan(enhancedPlan || null);
    })();
  }, []);

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    await put('plan', 'enhanced', plan);
    // Also save as current plan for backward compatibility
    await put('plan', 'current', {
      version: plan.version || '0.1.0',
      cycle: plan.cycle || { weeks: plan.weeksPlanned?.value || 8, startISO: new Date().toISOString().split('T')[0] },
      profileSnapshot: plan.profileSnapshot
    });
    setSaving(false);
  };

  const handleReviewStrategy = async () => {
    if (!plan) return;
    
    if (!hasApiKey) {
      setReviewResult({
        analysis: 'API key required for strategy review. Please configure your OpenAI API key in Settings.',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        warnings: ['No API key configured']
      });
      return;
    }

    setReviewing(true);
    try {
      const review = await reviewCurrentStrategy(plan, profile || undefined);
      setReviewResult(review);
    } catch (error: any) {
      setReviewResult({
        analysis: `Error during strategy review: ${error?.message || 'Unknown error'}`,
        strengths: [],
        weaknesses: [],
        suggestions: [],
        warnings: ['Strategy review failed. Please try again.']
      });
    } finally {
      setReviewing(false);
    }
  };

  const updateField = <T,>(field: keyof EnhancedPlan, value: T) => {
    if (!plan) return;
    const currentField = (plan as any)[field];
    setPlan({
      ...plan,
      [field]: {
        ...currentField,
        value,
        ownership: 'athlete',
        lastModified: Date.now(),
        modifiedBy: 'athlete',
        highlight: false
      }
    });
  };

  const toggleLock = (field: keyof EnhancedPlan) => {
    if (!plan) return;
    const currentField = (plan as any)[field];
    if (!currentField) return;
    setPlan({
      ...plan,
      [field]: {
        ...currentField,
        ownership: currentField.ownership === 'locked' ? 'athlete' : 'locked'
      }
    });
  };

  if (!plan) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Strategy Coach</h1>
        <div className="card p-4 flex items-center justify-between">
          <div>No plan yet. Complete onboarding to generate your first plan.</div>
          <a className="btn btn-primary" href="/onboarding">Start Onboarding</a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Strategy Coach</h1>
        <div className="flex gap-2">
          <button 
            className="btn btn-sm flex items-center gap-2"
            onClick={handleReviewStrategy}
            disabled={reviewing}
          >
            <Lightbulb className={`w-4 h-4 ${reviewing ? 'animate-pulse' : ''}`} />
            {reviewing ? 'Reviewing...' : 'Review Strategy'}
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Review Results Banner */}
      {reviewResult && (
        <div className="card p-3 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Strategy Review</h3>
              <p className="text-xs mb-2">{reviewResult.analysis}</p>
              
              {reviewResult.strengths.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-medium">Strengths</span>
                  </div>
                  <ul className="text-xs text-muted list-disc list-inside ml-5">
                    {reviewResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {reviewResult.weaknesses.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-medium">Areas to Consider</span>
                  </div>
                  <ul className="text-xs text-muted list-disc list-inside ml-5">
                    {reviewResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {reviewResult.suggestions.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Suggestions</div>
                  <div className="grid gap-1.5">
                    {reviewResult.suggestions.map((sug, i) => (
                      <div key={i} className="flex items-start justify-between p-1.5 bg-white rounded border border-line gap-2">
                        <div className="text-xs flex-1">
                          <div className="font-medium mb-0.5">{sug.field}</div>
                          <div className="text-[10px] text-muted mb-0.5">{sug.reason}</div>
                          <div className="text-[10px]">
                            <span className="text-muted">Current:</span> <span className="font-mono">{JSON.stringify(sug.currentValue)}</span>
                            {' → '}
                            <span className="text-muted">Suggested:</span> <span className="font-mono text-aptum-blue">{JSON.stringify(sug.suggestedValue)}</span>
                          </div>
                        </div>
                        <button 
                          className="px-2 py-1 text-[10px] bg-aptum-blue text-white rounded hover:bg-aptum-blue/90 flex-shrink-0"
                          onClick={() => {
                            if (plan) {
                              updateField(sug.field as keyof EnhancedPlan, sug.suggestedValue);
                              // Show success feedback
                              const updatedSuggestions = reviewResult.suggestions.filter((_, idx) => idx !== i);
                              setReviewResult({ ...reviewResult, suggestions: updatedSuggestions });
                            }
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reviewResult.alternativeModels && reviewResult.alternativeModels.length > 0 && (
                <div className="pt-2 border-t border-line">
                  <div className="text-sm font-medium mb-1">Alternative Periodization Models</div>
                  <div className="text-xs text-muted mb-2">The AI suggests considering these alternative models for your goals:</div>
                  <div className="flex flex-wrap gap-2">
                    {reviewResult.alternativeModels.map((modelKey) => (
                      <button
                        key={modelKey}
                        className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                        onClick={() => {
                          if (plan && plan.periodizationModel) {
                            updateField('periodizationModel', modelKey);
                            setReviewResult(null); // Clear review after applying
                          }
                        }}
                      >
                        {modelKey.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {reviewResult.warnings && reviewResult.warnings.length > 0 && (
                <div className="pt-2 border-t border-line">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs font-medium text-red-600">Warnings</span>
                  </div>
                  <ul className="text-xs text-red-700 list-disc list-inside ml-5">
                    {reviewResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan Configuration */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left Column: Core Plan Fields */}
        <div className="card p-3">
          <h2 className="font-semibold text-sm mb-2">Mesocycle Configuration</h2>
          <div className="space-y-2">
            {/* Basic settings in 3-column grid */}
            <div className="grid grid-cols-3 gap-2">
              {plan.weeksPlanned && (
                <NumberField
                  label="Weeks"
                  field={plan.weeksPlanned}
                  onValueChange={(v) => updateField('weeksPlanned', v)}
                  onLockToggle={() => toggleLock('weeksPlanned')}
                  min={4}
                  max={20}
                  compact={true}
                />
              )}

              {plan.sessionsPerWeek && (
                <NumberField
                  label="Sessions/Week"
                  field={plan.sessionsPerWeek}
                  onValueChange={(v) => updateField('sessionsPerWeek', v)}
                  onLockToggle={() => toggleLock('sessionsPerWeek')}
                  min={2}
                  max={14}
                  compact={true}
                />
              )}

              {plan.buildToDeloadRatio && (
                <DeloadRatioField
                  label="Deload Ratio"
                  field={plan.buildToDeloadRatio}
                  onValueChange={(v) => updateField('buildToDeloadRatio', v)}
                  onLockToggle={() => toggleLock('buildToDeloadRatio')}
                />
              )}
            </div>

            {plan.periodizationModel && (
              <PeriodizationModelSelector
                field={plan.periodizationModel}
                onModelChange={(model) => updateField('periodizationModel', model)}
                showRecommendedBadge={plan.periodizationModel.modifiedBy === 'ai'}
              />
            )}
          </div>
        </div>

        {/* Right Column: Plan Details & Sources */}
        <div className="grid gap-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Plan Details</h2>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Version</span>
                <span className="font-medium">{plan.version || '0.1.0'}</span>
              </div>
              {plan.cycle && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Start Date</span>
                    <span className="font-medium">{plan.cycle.startISO}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Total Weeks</span>
                    <span className="font-medium">{plan.cycle.weeks}</span>
                  </div>
                </>
              )}
              {plan.changeHistory && (
                <div className="flex justify-between">
                  <span className="text-muted">Modifications</span>
                  <span className="font-medium">{plan.changeHistory.length} changes</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-3">Knowledge Sources</h2>
            {plan.sources && plan.sources.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {plan.sources.map((s, i) => (
                  <li key={i}>
                    <a 
                      className="text-aptum-blue hover:underline" 
                      href={s.url} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      {s.title || s.id}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted">No knowledge sources attached to this plan.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
