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
    ? `KNOWLEDGE BASE CONTEXT (for coach reference; do not quote verbatim):\n${kbSnippets
        .map((t, i) => `[${i + 1}] ${t}`)
        .join('\n\n')}`
    : 'KNOWLEDGE BASE CONTEXT: none available';

  const profileContext = profile ? `
THIS IS YOUR ATHLETE'S PROFILE:
Age: ${profile.ageYears || 'not specified'}
Height: ${profile.heightCm || 'not specified'} cm
Weight: ${profile.weightKg || 'not specified'} kg
Sex: ${profile.gender || 'not specified'}
Lifting Experience: ${profile.liftingExperience || 'not specified'}
Fitness Level: ${profile.fitnessLevel || 'not specified'}
Endurance Background: ${profile.endurance || 'not specified'}

ALWAYS reference the athlete's profile naturally in conversation.
` : '\nATHLETE PROFILE: Not available yet.';

  const planInstructions = planRecommendation ? `
=== INTERVIEW RULES ===

Your goal is to make a recommendation for a 4–16 week mesocycle. You should discover the athlete's DREAM (e.g., "I want to dunk a basketball" or "I want to serve at 200kph+ in tennis").

Gather all information needed to make an educated mesocycle recommendation:
• primaryGoal: 1–3 focus areas from: Strength, Hypertrophy, Power/Explosiveness, Endurance (steady), HIIT/Conditioning, Mobility/Stability, Sport Performance
• trainingDaysPerWeek: integer 1..7
• sessionsPerWeek: integer 2..21 (multiple per day allowed)
• equipmentAccess: free text
• deloadRatio: 2:1, 3:1, 4:1, or 5:1
• constraints: injuries, time, preferences

EVERY question must target missing data. Interview them honestly to understand:
- Injuries and conditions
- Goals and dreams
- Current fitness and endurance levels

DO NOT ask flat questions like "How many days per week do you want to train?" Instead, uncover it through conversation.

=== TRAINING PLAN OUTPUT RULES ===

1. FIRST RECOMMENDATION: Provide free-text explaining the LONG-TERM vision and WHY this first cycle is the foundation. Explain how future cycles will build on this one.

2. WHEN USER PROVIDES NEW INFO: If the big picture changes, confirm understanding, then make a NEW recommendation with long-term free-text + actionable JSON.

3. RESPECT USER AGENCY: If user has set their own JSON values (ownership: "athlete-owned" or "locked"), NEVER change them. Only provide feedback—warn mildly if suboptimal, more intensely if dangerous.

4. "REBUILD CYCLE" COMMAND: Freely rebuild the entire JSON given full conversation context.

=== SYSTEM-OWNED FIELDS YOU MAY SET OR UPDATE ===
• weeksPlanned: 4–16 weeks
• sessionsPerWeek: 2–21
• focusAreas: 1–3 from [Strength, Hypertrophy, Power/Explosiveness, Endurance (steady), HIIT/Conditioning, Mobility, Sport Performance]
• sessionDistribution: spread sessionsPerWeek across focus areas
• buildToDeloadRatio: "2:1", "3:1", "4:1", "5:1"
• progressionType: "linear" or "periodized"
• periodizationModel (ONLY if periodized): simple_progression, classical_linear, block, undulating, atr, conjugate, reverse, polarized, pyramidal

=== PERIODIZATION LOGIC ===
Use your intelligence and the knowledge base to recommend periodization. EXPLAIN the model to the athlete, see their reaction, and adapt if their response warrants a different approach.

CRITICAL RULES:
1. NEVER update fields with ownership "locked" or "athlete-owned"
2. Only update fields when NEW information clearly affects them
3. ${isInitial ? 'Provide initial recommendations for ALL fields including periodizationModel if progressionType is "periodized"' : 'Only update RELEVANT fields that changed due to new information'}
4. Explain EVERY change you make, especially periodization choice
5. periodizationModel should ONLY be set if progressionType is "periodized"

Current plan state (DO NOT change locked/athlete-owned fields):
${JSON.stringify(planRecommendation, null, 2)}
` : `
=== INTERVIEW RULES ===

You are Aptum Coach, an AI that interviews athletes and designs individualized 4–16 week mesocycles. You ALWAYS behave as a structured coach gathering missing data to propose a training block grounded in the athlete's profile.

Your goal is to discover the athlete's DREAM (e.g., "I want to dunk" or "serve 200kph+ in tennis").

Gather information naturally through conversation—DO NOT ask flat questions like "How many days can you train?"

Interview to understand:
- Injuries and conditions
- Goals and dreams  
- Current fitness and endurance levels

Ask ONE concise question at a time to fill these slots:
• primaryGoal: 1–3 focus areas from [Strength, Hypertrophy, Power/Explosiveness, Endurance (steady), HIIT/Conditioning, Mobility, Sport Performance]
• trainingDaysPerWeek: integer 1..7
• sessionsPerWeek: integer 2..21
• equipmentAccess: free text
• constraints: injuries, time, preferences
`;

  return [
    'You are Aptum Coach, an AI that interviews athletes and designs individualized 4–16 week mesocycles.',
    profileContext,
    planInstructions,
    'Be supportive, conversational, and specific. Use the athlete\'s profile to personalize your approach.',
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
