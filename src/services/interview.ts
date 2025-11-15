import { chatJSON } from './llm';
import { search as kbSearch } from './retrieve';
import { get, put } from './storage';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };
export type GoalsSlots = {
  primaryGoal?: 'hypertrophy' | 'strength' | 'fat loss' | 'endurance' | 'mixed' | string;
  daysPerWeek?: number;
  equipment?: string;
  constraints?: string;
};

export type FocusArea = 
  | 'Strength'
  | 'Hypertrophy'
  | 'Power / Explosiveness'
  | 'Endurance (steady)'
  | 'HIIT / Conditioning'
  | 'Mobility'
  | 'Sport Performance'
  | 'Fat Loss'
  | 'Longevity / Health';

export type FieldOwnership = 'locked' | 'athlete-owned' | 'system-owned';

export type PlanField = {
  value: any;
  ownership: FieldOwnership;
  lastUpdated?: number;
  highlight?: boolean;
};

export type PlanRecommendation = {
  weeksPlanned: PlanField;
  sessionsPerWeek: PlanField;
  focusAreas: PlanField; // Array of 1-3 FocusArea
  sessionDistribution: PlanField; // Record<FocusArea, number>
  buildToDeloadRatio: PlanField; // e.g., "3:1"
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
  };
}

export async function loadGoalsInterview(): Promise<GoalsInterviewState> {
  const saved = await get<GoalsInterviewState>('conversation', STORE_KEY);
  return saved || { messages: [], slots: {}, planRecommendation: createDefaultPlanRecommendation() };
}

export async function saveGoalsInterview(state: GoalsInterviewState) {
  await put('conversation', STORE_KEY, state);
}

export function canUpdateField(field: PlanField): boolean {
  return field.ownership === 'system-owned';
}

function systemPrompt(kbSnippets: string[], planRecommendation: PlanRecommendation | undefined, isInitial: boolean) {
  const kb = kbSnippets.length
    ? `KB context (for coach reference; do not quote verbatim):\n${kbSnippets
        .map((t, i) => `[${i + 1}] ${t}`)
        .join('\n\n')}`
    : 'KB context: none available';

  const focusAreas = [
    'Strength', 'Hypertrophy', 'Power / Explosiveness', 
    'Endurance (steady)', 'HIIT / Conditioning', 'Mobility', 
    'Sport Performance', 'Fat Loss', 'Longevity / Health'
  ];

  const planInstructions = planRecommendation ? `
PLAN RECOMMENDATIONS:
You may recommend values for these fields ONLY if they are system-owned (ownership: "system-owned"):
- weeksPlanned: number (4-16 weeks based on experience)
- sessionsPerWeek: number (2-7 based on availability and goals)
- focusAreas: array of 1-3 areas from: ${focusAreas.join(', ')}
- sessionDistribution: object mapping each focus area to number of sessions
- buildToDeloadRatio: string (e.g., "3:1", "4:1")
- startingWeek: optional ISO date string

CRITICAL RULES:
1. NEVER update fields with ownership "locked" or "athlete-owned"
2. Only update fields when NEW information clearly affects them
3. ${isInitial ? 'Provide initial recommendations for ALL fields' : 'Only update RELEVANT fields that changed due to new information'}
4. Explain EVERY change you make in your reply
5. If a field is locked or athlete-owned, you MUST NOT change it

Current plan state (DO NOT change locked/athlete-owned fields):
${JSON.stringify(planRecommendation, null, 2)}
` : '';

  return [
    'You are Aptum Coach, interviewing an athlete to design a mesocycle.',
    'Interview via chat. Ask ONE concise question at a time to fill these slots:',
    '- primaryGoal: hypertrophy | strength | fat loss | endurance | mixed',
    '- daysPerWeek: integer (2..7)',
    '- equipment: free text (e.g., full gym, limited, home setup)',
    '- constraints: injuries, time constraints, preferences',
    planInstructions,
    'Be supportive, brief, and specific. Use context to tailor advice.',
    'Return STRICT JSON only with this structure:',
    '{"reply": string, "ask_next": boolean, "slots": {...partial slot updates...}, "planUpdates": {...only changed fields with explanations...}, "changedFields": string[]}',
    kb
  ].join('\n');
}

export async function askGoals(state: GoalsInterviewState, userText: string): Promise<GoalsInterviewState> {
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

  const system = systemPrompt(snippets, hasEnoughSlots ? planRec : undefined, isInitialRecommendation);
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

export async function rebuildPlan(state: GoalsInterviewState): Promise<GoalsInterviewState> {
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

  const system = systemPrompt(snippets, state.planRecommendation, true);
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
