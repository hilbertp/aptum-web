import { chatJSON } from './llm';
import { search as kbSearch } from './retrieve';
import { get, put } from './storage';
import type { Profile } from './coach';
import { driveSync } from './driveSync';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };
export type GoalsSlots = {
  primaryGoal?: 'hypertrophy' | 'strength' | 'endurance' | 'mixed' | string;
  daysPerWeek?: number;
  equipment?: string;
  constraints?: string;
};

// Focus areas can be predefined or custom strings
export type FocusArea = string;

export const SUGGESTED_FOCUS_AREAS = [
  'Strength',
  'Hypertrophy',
  'Power / Explosiveness',
  'Endurance (steady)',
  'HIIT / Conditioning',
  'Mobility',
  'Sport Performance'
] as const;

export type BlockerType = 'team-practice' | 'game-day' | 'off-day' | 'recovery';
export type StrainLevel = 0 | 1 | 2 | 3; // 0 = none, 1 = low, 2 = medium, 3 = high

export type Blocker = {
  id: string;
  date: string; // ISO date string
  type: BlockerType;
  strain: StrainLevel;
  notes?: string;
};

export type FieldOwnership = 'locked' | 'athlete-owned' | 'system-owned';

export type PlanField = {
  value: any;
  ownership: FieldOwnership;
  lastUpdated?: number;
  highlight?: boolean;
};

export type ProgressionType = 'linear' | 'periodized';

export type PeriodizationModel = 
  | 'simple_progression'
  | 'classical_linear'
  | 'block'
  | 'atr'
  | 'undulating'
  | 'conjugate'
  | 'reverse'
  | 'polarized'
  | 'pyramidal';

export type PlanRecommendation = {
  weeksPlanned: PlanField;
  sessionsPerWeek: PlanField;
  focusAreas: PlanField; // Array of 1-3 FocusArea
  sessionDistribution: PlanField; // Record<FocusArea, number>
  buildToDeloadRatio: PlanField; // e.g., "3:1"
  progressionType: PlanField; // 'linear' or 'periodized'
  periodizationModel?: PlanField; // Only when progressionType is 'periodized'
  startingWeek?: PlanField; // Optional ISO date
};

export type GoalsInterviewState = {
  messages: ChatMsg[];
  slots: GoalsSlots;
  planRecommendation?: PlanRecommendation;
};

const STORE_KEY = 'interview:goals';

export function createDefaultPlanField(value: any, ownership: FieldOwnership = 'system-owned'): PlanField {
  return { value, ownership, lastUpdated: Date.now(), highlight: false };
}

export function createDefaultPlanRecommendation(): PlanRecommendation {
  return {
    weeksPlanned: createDefaultPlanField(8),
    sessionsPerWeek: createDefaultPlanField(4),
    focusAreas: createDefaultPlanField([]),
    sessionDistribution: createDefaultPlanField({}),
    buildToDeloadRatio: createDefaultPlanField('3:1'),
    progressionType: createDefaultPlanField('linear'),
  };
}

export async function loadGoalsInterview(): Promise<GoalsInterviewState> {
  const saved = await get<GoalsInterviewState>('conversation', STORE_KEY);
  return saved || { messages: [], slots: {}, planRecommendation: createDefaultPlanRecommendation() };
}

export async function saveGoalsInterview(state: GoalsInterviewState) {
  await put('conversation', STORE_KEY, state);
  // Sync to Drive if authenticated
  if (driveSync.hasToken) {
    try {
      await driveSync.uploadAllData();
    } catch (error) {
      console.error('Failed to sync interview to Drive:', error);
    }
  }
}

export function canUpdateField(field: PlanField): boolean {
  return field.ownership === 'system-owned';
}

function systemPrompt(kbSnippets: string[], planRecommendation: PlanRecommendation | undefined, isInitial: boolean, profile?: Profile) {
  const kb = kbSnippets.length
    ? `KB context (for coach reference; do not quote verbatim):\n${kbSnippets
        .map((t, i) => `[${i + 1}] ${t}`)
        .join('\n\n')}`
    : 'KB context: none available';

  const focusAreas = [
    'Strength', 'Hypertrophy', 'Power / Explosiveness', 
    'Endurance (steady)', 'HIIT / Conditioning', 'Mobility', 
    'Sport Performance'
  ];

  const profileContext = profile ? `
ATHLETE PROFILE:
${JSON.stringify(profile, null, 2)}

USE THIS PROFILE DATA TO TAILOR RECOMMENDATIONS:
- Lifting Experience (${profile.liftingExperience || 'not specified'}): Determines progression complexity
  * novice: Simple linear progression, focus on technique
  * intermediate: Can handle periodization, more volume
  * advanced/expert: Complex periodization, higher intensities
- Fitness Level (${profile.fitnessLevel || 'not specified'}): Affects conditioning capacity and recovery
- Age (${profile.ageYears || 'not specified'}): Older athletes need more recovery, adjust volume accordingly
- Gender (${profile.gender || 'not specified'}): May affect recovery capacity and hormone optimization
- Endurance Background: ${profile.endurance || 'not specified'}

ALWAYS reference the athlete's profile when making recommendations. For example:
"Given your ${profile.liftingExperience} experience level..." or "As a ${profile.fitnessLevel} athlete..."
` : '\nATHLETE PROFILE: Not available yet. Collect basic info during interview if needed.';

  const planInstructions = planRecommendation ? `
PLAN RECOMMENDATIONS:
You may recommend values for these fields ONLY if they are system-owned (ownership: "system-owned"):
- weeksPlanned: number (4-16 weeks based on experience and goal)
- sessionsPerWeek: number (2-21, can include multiple sessions per day like lifting + cardio)
- focusAreas: array of 1-3 areas from: ${focusAreas.join(', ')} (or custom athlete-defined areas)
- sessionDistribution: object mapping each focus area to number of sessions per week
- buildToDeloadRatio: string (e.g., "3:1" means 3 weeks build + 1 week deload, "4:1", "5:1")
- progressionType: "linear" (beginner-friendly, 4-8 weeks, steady progression) OR "periodized" (advanced, varied intensities/volumes with specific models)
- periodizationModel: (ONLY if progressionType is "periodized") Choose from:
  * "simple_progression": Continuous progressive overload, no phases (beginners, general fitness)
  * "classical_linear": High volume → low volume, low intensity → high intensity over time (intermediate, strength focus, off-season)
  * "block": Sequential blocks - Accumulation (volume) → Intensification (intensity) → Realization (peaking) (advanced, competition prep, powerlifters)
  * "undulating": Daily/weekly variation in volume & intensity (intermediate to advanced, variety seekers)
  * "atr": Accumulate → Transmute → Realize variant of block (advanced athletes, structured peaking)
  * "conjugate": Concurrent max effort + dynamic effort + repetition work (advanced powerlifters, Westside-style)
  * "reverse": Starts high intensity, progresses to volume (unique scenarios, advanced)
  * "polarized": 80% low intensity + 20% high intensity (endurance athletes, longevity focus)
  * "pyramidal": Volume base → intensity peak (visual pyramid structure, bodybuilders)
- startingWeek: optional ISO date string

PERIODIZATION MODEL SELECTION GUIDANCE:
- For BEGINNERS (< 6 months): Use progressionType "linear", NO periodizationModel
- For INTERMEDIATE (6-24 months): Consider "periodized" with "classical_linear" or "undulating"
- For ADVANCED (2+ years): Consider "periodized" with "block", "conjugate", or "atr"
- For LONGEVITY/HEALTH focus: Consider "polarized" model
- For ENDURANCE athletes: "polarized" or "undulating"
- For POWERLIFTERS/STRENGTH: "block", "conjugate", or "classical_linear"
- For HYPERTROPHY: "undulating" or "classical_linear"

CRITICAL RULES:
1. NEVER update fields with ownership "locked" or "athlete-owned"
2. Only update fields when NEW information clearly affects them
3. ${isInitial ? 'Provide initial recommendations for ALL fields including periodizationModel if progressionType is "periodized"' : 'Only update RELEVANT fields that changed due to new information'}
4. Explain EVERY change you make in your reply, especially periodization model choice
5. If a field is locked or athlete-owned, you MUST NOT change it
6. periodizationModel should ONLY be set if progressionType is "periodized"
7. For beginners, default to progressionType "linear" (no model needed)

Current plan state (DO NOT change locked/athlete-owned fields):
${JSON.stringify(planRecommendation, null, 2)}
` : '';

  return [
    'You are Aptum Coach, interviewing an athlete to design a mesocycle.',
    profileContext,
    'Interview via chat. Ask ONE concise question at a time to fill these slots:',
    '- primaryGoal: hypertrophy | strength | endurance | mixed',
    '- daysPerWeek: integer (2..7, training days available per week)',
    '- equipment: free text (e.g., full gym, limited, home setup)',
    '- constraints: injuries, time constraints, preferences',
    planInstructions,
    'Be supportive, brief, and specific. Use context to tailor advice.',
    'Note: sessionsPerWeek (2-21) can exceed daysPerWeek since athletes may do multiple sessions per day.',
    'Return STRICT JSON only with this structure:',
    '{"reply": string, "ask_next": boolean, "slots": {...partial slot updates...}, "planUpdates": {...only changed fields with explanations...}, "changedFields": string[]}',
    kb
  ].join('\n');
}

export async function askGoals(state: GoalsInterviewState, userText: string, profile?: Profile): Promise<GoalsInterviewState> {
  // Retrieve KB based on the latest user message
  let snippets: string[] = [];
  try {
    const results = await kbSearch(userText, { topK: 4, filters: { kinds: ['paper', 'note', 'video_note', 'video_claim'] } });
    snippets = results.map((r) => (r.text || '').slice(0, 800)).filter(Boolean);
  } catch {
    // ignore retrieval failures
  }

  // Check if we should request initial plan recommendations
  const hasEnoughSlots = !!(state.slots.primaryGoal && state.slots.daysPerWeek && state.slots.equipment);
  const isInitialRecommendation = hasEnoughSlots && !state.planRecommendation;
  const planRec = state.planRecommendation || createDefaultPlanRecommendation();

  const transcript = state.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .concat([`USER: ${userText}`])
    .join('\n');

  const system = systemPrompt(snippets, hasEnoughSlots ? planRec : undefined, isInitialRecommendation, profile);
  const user = [
    'Transcript so far (most recent last):',
    transcript,
    'Current slots (partial allowed):',
    JSON.stringify(state.slots),
    hasEnoughSlots ? '\nGenerate plan recommendations based on the interview information.' : '',
    'Respond now with STRICT JSON only.'
  ].join('\n\n');

  const json = await chatJSON(system, user);
  const reply: string = (json?.reply ?? '').toString();
  const nextSlots: GoalsSlots = { ...state.slots, ...(json?.slots || {}) };
  
  // Process plan updates
  let updatedPlan = { ...planRec };
  const changedFields: string[] = json?.changedFields || [];
  
  if (json?.planUpdates && hasEnoughSlots) {
    const updates = json.planUpdates;
    
    // Update only system-owned fields
    Object.keys(updates).forEach((fieldName) => {
      const field = updatedPlan[fieldName as keyof PlanRecommendation];
      if (field && canUpdateField(field)) {
        updatedPlan[fieldName as keyof PlanRecommendation] = {
          ...field,
          value: updates[fieldName],
          lastUpdated: Date.now(),
          highlight: true,
        };
      }
    });
  }

  const next: GoalsInterviewState = {
    messages: [...state.messages, { role: 'user', content: userText }, { role: 'assistant', content: reply }],
    slots: nextSlots,
    planRecommendation: updatedPlan,
  };
  
  await saveGoalsInterview(next);
  return next;
}

export function slotsComplete(slots: GoalsSlots) {
  return !!(slots.primaryGoal && slots.daysPerWeek && slots.equipment);
}

export async function rebuildPlan(state: GoalsInterviewState, profile?: Profile): Promise<GoalsInterviewState> {
  if (!state.planRecommendation) return state;

  // Retrieve KB based on the goal
  let snippets: string[] = [];
  try {
    const goalQuery = `${state.slots.primaryGoal || 'fitness'} periodization training plan`;
    const results = await kbSearch(goalQuery, { topK: 4, filters: { kinds: ['paper', 'note', 'video_note'] } });
    snippets = results.map((r) => (r.text || '').slice(0, 800)).filter(Boolean);
  } catch {
    // ignore retrieval failures
  }

  const system = systemPrompt(snippets, state.planRecommendation, true, profile);
  const user = [
    'The athlete has requested to rebuild the plan.',
    'Current interview slots:',
    JSON.stringify(state.slots, null, 2),
    '\nRegenerate ALL unlocked (system-owned) plan fields based on the current information.',
    'Explain what changed and why in your reply.',
    'Respond with STRICT JSON only.'
  ].join('\n\n');

  const json = await chatJSON(system, user);
  const reply: string = json?.reply || 'Plan has been rebuilt based on your information.';
  
  // Update all system-owned fields
  let updatedPlan = { ...state.planRecommendation };
  if (json?.planUpdates) {
    const updates = json.planUpdates;
    Object.keys(updates).forEach((fieldName) => {
      const field = updatedPlan[fieldName as keyof PlanRecommendation];
      if (field && canUpdateField(field)) {
        updatedPlan[fieldName as keyof PlanRecommendation] = {
          ...field,
          value: updates[fieldName],
          lastUpdated: Date.now(),
          highlight: true,
        };
      }
    });
  }

  const next: GoalsInterviewState = {
    ...state,
    messages: [...state.messages, { role: 'assistant', content: reply }],
    planRecommendation: updatedPlan,
  };

  await saveGoalsInterview(next);
  return next;
}

export async function resetGoalsInterview() {
  await put('conversation', STORE_KEY, { 
    messages: [], 
    slots: {}, 
    planRecommendation: createDefaultPlanRecommendation() 
  } as GoalsInterviewState);
}
