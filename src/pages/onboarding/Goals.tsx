import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Heart, Zap, Minus, Plus } from 'lucide-react';
import { 
  askGoals, 
  loadGoalsInterview, 
  resetGoalsInterview, 
  rebuildPlan,
  slotsComplete,
  type GoalsInterviewState,
  type PlanField,
  type FocusArea as InterviewFocusArea,
  SUGGESTED_FOCUS_AREAS
} from '@/services/interview';
import { byok } from '@/services/byok';
import { loadProfile, type Profile } from '@/services/coach';

type FocusArea = '' | 'Strength' | 'Hypertrophy' | 'Power / Explosiveness' | 'Endurance (steady)' | 'HIIT / Conditioning' | 'Mobility' | 'Sport Performance' | 'Fat Loss' | 'Longevity / Health';

const FOCUS_AREAS: FocusArea[] = [
  '',
  'Strength',
  'Hypertrophy', 
  'Power / Explosiveness',
  'Endurance (steady)',
  'HIIT / Conditioning',
  'Mobility',
  'Sport Performance',
  'Fat Loss',
  'Longevity / Health'
];

const FOCUS_AREA_ICONS: Record<string, React.ReactNode> = {
  'Strength': <Dumbbell className="w-5 h-5" />,
  'Hypertrophy': <Dumbbell className="w-5 h-5" />,
  'Power / Explosiveness': <Zap className="w-5 h-5" />,
  'Endurance (steady)': <Heart className="w-5 h-5" />,
  'HIIT / Conditioning': <Zap className="w-5 h-5" />,
};

export default function Goals() {
  const nav = useNavigate();
  
  // AI Coach state
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [state, setState] = useState<GoalsInterviewState>({ messages: [], slots: {}, planRecommendation: undefined });
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<Profile | undefined>();
  const listRef = useRef<HTMLDivElement>(null);
  const hasApiKey = !!byok.get().apiKey;
  
  // Local UI state
  const [priority1, setPriority1] = useState<FocusArea>('');
  const [priority2, setPriority2] = useState<FocusArea>('');
  const [priority3, setPriority3] = useState<FocusArea>('');
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [deloadRatio, setDeloadRatio] = useState(3);
  const [progressionType, setProgressionType] = useState<'linear' | 'periodized'>('linear');
  const [periodizationModel, setPeriodizationModel] = useState('linear-periodization');
  
  // Track if user made changes from AI recommendations
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const [initialRecommendations, setInitialRecommendations] = useState<any>(null);
  
  // Get active priorities
  const activePriorities = [priority1, priority2, priority3].filter(p => p !== '');
  
  // Calculate total allocated sessions
  const allocatedSessions = activePriorities.reduce((sum, priority) => {
    return sum + (distribution[priority] || 0);
  }, 0);
  
  // Load AI interview state and profile
  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        loadGoalsInterview(),
        loadProfile()
      ]);
      setState(s);
      setProfile(p);
      setLoading(false);
      
      // Initialize from AI recommendations if available
      if (s.planRecommendation) {
        initializeFromRecommendations(s.planRecommendation);
        setInitialRecommendations(JSON.stringify(s.planRecommendation));
      }
    })();
  }, []);
  
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length, thinking]);
  
  // Initialize UI from AI recommendations
  const initializeFromRecommendations = (plan: any) => {
    const focuses = plan.focusAreas?.value || [];
    setPriority1(focuses[0] || '');
    setPriority2(focuses[1] || '');
    setPriority3(focuses[2] || '');
    
    const dist = plan.sessionDistribution?.value || {};
    setDistribution(dist);
    
    const ratio = plan.buildToDeloadRatio?.value || '3:1';
    setDeloadRatio(parseInt(ratio.split(':')[0]) || 3);
    
    setProgressionType(plan.progressionType?.value || 'linear');
    setPeriodizationModel(plan.periodizationModel?.value || 'linear-periodization');
  };
  
  // Track changes
  useEffect(() => {
    if (!initialRecommendations || !state.planRecommendation) return;
    
    const currentState = JSON.stringify({
      focusAreas: activePriorities,
      distribution,
      deloadRatio,
      progressionType
    });
    
    const hasChanged = currentState !== JSON.stringify({
      focusAreas: state.planRecommendation.focusAreas?.value || [],
      distribution: state.planRecommendation.sessionDistribution?.value || {},
      deloadRatio: parseInt((state.planRecommendation.buildToDeloadRatio?.value || '3:1').split(':')[0]),
      progressionType: state.planRecommendation.progressionType?.value
    });
    
    setHasUserChanges(hasChanged);
  }, [priority1, priority2, priority3, distribution, deloadRatio, progressionType, state.planRecommendation, initialRecommendations]);
  
  // Update distribution when priorities change
  useEffect(() => {
    const newDist: Record<string, number> = {};
    activePriorities.forEach((priority, idx) => {
      if (priority) {
        newDist[priority] = distribution[priority] || (idx === 0 ? 3 : 2);
      }
    });
    setDistribution(newDist);
  }, [priority1, priority2, priority3]);
  
  const updateDistribution = (area: string, delta: number) => {
    const current = distribution[area] || 0;
    const newValue = Math.max(0, Math.min(21, current + delta));
    setDistribution({ ...distribution, [area]: newValue });
  };
  
  const updateDeloadRatio = (delta: number) => {
    setDeloadRatio(Math.max(2, Math.min(6, deloadRatio + delta)));
  };
  
  // AI Coach functions
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
      const next = await askGoals(state, text, profile);
      setState(next);
      if (next.planRecommendation) {
        initializeFromRecommendations(next.planRecommendation);
        setInitialRecommendations(JSON.stringify(next.planRecommendation));
      }
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
  
  async function handleReviewPlan() {
    if (!hasApiKey) return;
    
    const reviewMessage = `I've made some changes to your recommendations:
- Focus areas: ${activePriorities.join(', ')}
- Session distribution: ${Object.entries(distribution).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Deload ratio: ${deloadRatio}:1
- Progression: ${progressionType}

Please review these changes and let me know if they make sense for my goals.`;
    
    setInput('');
    setThinking(true);
    
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: reviewMessage }]
    }));
    
    try {
      const next = await askGoals(state, reviewMessage, profile);
      setState(next);
      setHasUserChanges(false);
    } catch (e: any) {
      setState((prev) => ({ 
        ...prev, 
        messages: [...prev.messages, 
          { role: 'assistant', content: `Error: ${e?.message || e}` }
        ] 
      }));
    } finally {
      setThinking(false);
    }
  }
  
  const handleContinue = () => {
    nav('/onboarding/plan');
  };
  
  const canContinue = slotsComplete(state.slots) && state.planRecommendation;
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header matching Welcome/Profile/Connect steps */}
      <div className="bg-white border-b border-line px-6 py-4">
        <div className="text-sm text-muted">Step 4 of 6</div>
      </div>
      
      {/* Progress pills */}
      <div className="bg-white px-6 py-3 border-b border-line">
        <div className="flex gap-2">
          <button onClick={() => nav('/onboarding/welcome')} className="px-4 py-1.5 rounded-full bg-aptum-blue text-white text-sm">
            1. Welcome
          </button>
          <button onClick={() => nav('/onboarding/profile')} className="px-4 py-1.5 rounded-full bg-aptum-blue text-white text-sm">
            2. Profile
          </button>
          <button onClick={() => nav('/onboarding/connect')} className="px-4 py-1.5 rounded-full bg-aptum-blue text-white text-sm">
            3. Connect
          </button>
          <button className="px-4 py-1.5 rounded-full bg-aptum-blue text-white text-sm">
            4. Goals
          </button>
          <button className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 text-sm">
            5. Plan
          </button>
          <button className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 text-sm">
            6. Preview
          </button>
        </div>
      </div>
      
      {/* Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: AI Coach */}
        <div className="w-1/2 bg-white border-r border-line flex flex-col">
          <div className="p-6 border-b border-line">
            <h2 className="text-xl font-bold text-ink mb-2">Goals Interview</h2>
            <p className="text-sm text-muted">
              Say hi and tell me what you want to achieve. I'll ask brief follow-ups to understand your goals, availability, equipment, and constraints.
            </p>
          </div>
          
          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {state.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-4 py-2 text-sm max-w-[85%] ${
                  m.role === 'user' 
                    ? 'bg-aptum-blue text-white' 
                    : 'bg-panel border border-line text-ink'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {thinking && <div className="text-sm text-muted animate-pulse">Coach is thinking…</div>}
          </div>
          
          {/* Input */}
          <div className="p-6 border-t border-line">
            <div className="flex gap-2">
              <input 
                className="input flex-1" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(); }} 
                placeholder={hasApiKey ? "Type your message…" : "API key required"}
                disabled={!hasApiKey}
              />
              <button 
                className="btn btn-primary" 
                onClick={send} 
                disabled={thinking || !hasApiKey}
              >
                Send
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                className="btn btn-sm text-xs" 
                onClick={async () => { 
                  await resetGoalsInterview(); 
                  const s = await loadGoalsInterview(); 
                  setState(s); 
                }}
              >
                Reset Interview
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Panel: Plan Configuration */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          <div className="max-w-lg mx-auto px-6 py-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Define Your Focus</h1>
              <p className="text-gray-600">
                Set your training priorities and allocate sessions for your next block.
              </p>
            </div>
            
            {!hasApiKey && (
              <div className="mb-6 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                ⚠️ <span className="font-medium">API key not configured.</span> You can configure the plan manually, but AI recommendations require an OpenAI API key.
              </div>
            )}
            
            {/* Prioritize Training Focus */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Prioritize Training Focus</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select up to THREE training types in order of importance.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">1st Priority</label>
                  <select 
                    value={priority1} 
                    onChange={(e) => setPriority1(e.target.value as FocusArea)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-aptum-blue/40"
                  >
                    {FOCUS_AREAS.map(area => (
                      <option key={area} value={area}>{area || 'Select...'}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">2nd Priority</label>
                  <select 
                    value={priority2} 
                    onChange={(e) => setPriority2(e.target.value as FocusArea)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-aptum-blue/40"
                  >
                    {FOCUS_AREAS.map(area => (
                      <option key={area} value={area}>{area || 'Select...'}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">3rd Priority</label>
                  <select 
                    value={priority3} 
                    onChange={(e) => setPriority3(e.target.value as FocusArea)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-aptum-blue/40"
                  >
                    {FOCUS_AREAS.map(area => (
                      <option key={area} value={area}>{area || 'Select...'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
            
            {/* Weekly Session Count */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Weekly Session Count</h2>
              <p className="text-sm text-gray-600">
                Recommended for you: {allocatedSessions} sessions on {Math.min(Math.ceil(allocatedSessions / 1.4), 7)} days
              </p>
            </section>
            
            {/* Session Allocation */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Session Allocation</h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-700">Total Sessions:</span>
                <span className="text-sm font-semibold text-gray-900">{allocatedSessions}</span>
              </div>
              
              <div className="space-y-3">
                {activePriorities.map((priority) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-700">
                        {FOCUS_AREA_ICONS[priority] || <Dumbbell className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{priority}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateDistribution(priority, -1)}
                        className="w-9 h-9 rounded-lg bg-aptum-blue hover:bg-aptum-blue/90 text-white flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">
                        {distribution[priority] || 0}
                      </span>
                      <button
                        onClick={() => updateDistribution(priority, 1)}
                        className="w-9 h-9 rounded-lg bg-aptum-blue hover:bg-aptum-blue/90 text-white flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Deload Ratio */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Deload Ratio</h2>
              <p className="text-sm text-gray-600 mb-4">Build weeks to deload weeks ratio.</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Ratio</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateDeloadRatio(-1)}
                    className="w-9 h-9 rounded-lg bg-aptum-blue hover:bg-aptum-blue/90 text-white flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-gray-900">
                    {deloadRatio}:1
                  </span>
                  <button
                    onClick={() => updateDeloadRatio(1)}
                    className="w-9 h-9 rounded-lg bg-aptum-blue hover:bg-aptum-blue/90 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
            
            {/* Progression Type */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Progression Type</h2>
              <p className="text-sm text-gray-600 mb-4">Choose your progression strategy.</p>
              
              <div className="space-y-3">
                <select 
                  value={progressionType}
                  onChange={(e) => setProgressionType(e.target.value as 'linear' | 'periodized')}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-aptum-blue/40"
                >
                  <option value="linear">Linear</option>
                  <option value="periodized">Periodized</option>
                </select>
                
                {progressionType === 'periodized' && (
                  <select 
                    value={periodizationModel}
                    onChange={(e) => setPeriodizationModel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-aptum-blue/40"
                  >
                    <option value="linear-periodization">Linear Periodization</option>
                    <option value="reverse-linear-periodization">Reverse Linear Periodization</option>
                    <option value="block-periodization">Block Periodization</option>
                    <option value="daily-undulating-periodization">Daily Undulating Periodization</option>
                    <option value="weekly-undulating-periodization">Weekly Undulating Periodization</option>
                    <option value="conjugate-method">Conjugate Method</option>
                    <option value="concurrent-periodization">Concurrent Periodization</option>
                  </select>
                )}
              </div>
            </section>
            
            {/* Bottom Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => nav('/onboarding/connect')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              {hasUserChanges && hasApiKey ? (
                <button
                  onClick={handleReviewPlan}
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  Review Plan
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="flex-1 px-6 py-3 bg-aptum-blue text-white rounded-lg font-medium hover:bg-aptum-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
