import { useEffect, useState } from 'react';
import { loadPlan } from '@/services/coach';
import type { Plan, EnhancedPlan, PeriodizationModel } from '@/schemas/product';
import { put, get } from '@/services/storage';
import { NumberField, TextField } from '@/components/mesocycle/PlanField';
import { PeriodizationModelSelector } from '@/components/mesocycle/PeriodizationModelSelector';
import { createPlanField } from '@/services/planEngine';
import { AlertCircle, CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react';

export default function Strategy() {
  const [plan, setPlan] = useState<Partial<EnhancedPlan> | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: Array<{ field: string; reason: string; suggestedValue: any }>;
  } | null>(null);

  useEffect(() => {
    (async () => {
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
    setReviewing(true);
    // TODO: Integrate with AI coach service for strategy review
    // For now, show a placeholder
    setTimeout(() => {
      setReviewResult({
        analysis: 'Strategy review will be available once AI integration is complete.',
        strengths: ['Well-structured mesocycle', 'Appropriate weekly volume'],
        weaknesses: ['Consider adding more recovery weeks'],
        suggestions: [
          { field: 'buildToDeloadRatio', reason: 'More frequent deloads recommended for longevity', suggestedValue: '3:1' }
        ]
      });
      setReviewing(false);
    }, 1500);
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
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Strategy Review</h3>
              <p className="text-sm mb-3">{reviewResult.analysis}</p>
              
              {reviewResult.strengths.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Strengths</span>
                  </div>
                  <ul className="text-sm text-muted list-disc list-inside ml-6">
                    {reviewResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {reviewResult.weaknesses.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium">Areas to Consider</span>
                  </div>
                  <ul className="text-sm text-muted list-disc list-inside ml-6">
                    {reviewResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {reviewResult.suggestions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Suggestions</div>
                  <div className="grid gap-2">
                    {reviewResult.suggestions.map((sug, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-line">
                        <div className="text-sm">
                          <span className="font-medium">{sug.field}:</span> {sug.reason}
                        </div>
                        <button className="btn btn-sm text-xs">Apply</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan Configuration */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left Column: Core Plan Fields */}
        <div className="card p-4">
          <h2 className="font-semibold mb-4">Mesocycle Configuration</h2>
          <div className="grid gap-4">
            {plan.weeksPlanned && (
              <NumberField
                label="Weeks Planned"
                field={plan.weeksPlanned}
                onValueChange={(v) => updateField('weeksPlanned', v)}
                onLockToggle={() => toggleLock('weeksPlanned')}
                min={4}
                max={20}
                helpText="Total duration of your training mesocycle"
              />
            )}

            {plan.sessionsPerWeek && (
              <NumberField
                label="Sessions Per Week"
                field={plan.sessionsPerWeek}
                onValueChange={(v) => updateField('sessionsPerWeek', v)}
                onLockToggle={() => toggleLock('sessionsPerWeek')}
                min={2}
                max={14}
                helpText="Training frequency per week"
              />
            )}

            {plan.buildToDeloadRatio && (
              <TextField
                label="Build-to-Deload Ratio"
                field={plan.buildToDeloadRatio}
                onValueChange={(v) => updateField('buildToDeloadRatio', v)}
                onLockToggle={() => toggleLock('buildToDeloadRatio')}
                placeholder="e.g., 3:1, 4:1"
                helpText="Ratio of building weeks to recovery weeks"
              />
            )}

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
