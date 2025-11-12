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

export type GoalsInterviewState = {
  messages: ChatMsg[];
  slots: GoalsSlots;
};

const STORE_KEY = 'interview:goals';

export async function loadGoalsInterview(): Promise<GoalsInterviewState> {
  const saved = await get<GoalsInterviewState>('conversation', STORE_KEY);
  return saved || { messages: [], slots: {} };
}

export async function saveGoalsInterview(state: GoalsInterviewState) {
  await put('conversation', STORE_KEY, state);
}

function systemPrompt(kbSnippets: string[]) {
  const kb = kbSnippets.length
    ? `KB context (for coach reference; do not quote verbatim):\n${kbSnippets
        .map((t, i) => `[${i + 1}] ${t}`)
        .join('\n\n')}`
    : 'KB context: none available';
  return [
    'You are Aptum Coach, interviewing an athlete to design a mesocycle.',
    'Interview via chat. Ask ONE concise question at a time to fill these slots:',
    '- primaryGoal: hypertrophy | strength | fat loss | endurance | mixed',
    '- daysPerWeek: integer (2..7)',
    '- equipment: free text (e.g., full gym, limited, home setup)',
    '- constraints: injuries, time constraints, preferences',
    'Be supportive, brief, and specific. Use context to tailor advice. When slots are set, summarize and set ask_next=false.',
    'Return STRICT JSON only: {"reply": string, "ask_next": boolean, "slots": { ...partial merges... }}',
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

  const transcript = state.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .concat([`USER: ${userText}`])
    .join('\n');

  const system = systemPrompt(snippets);
  const user = [
    'Transcript so far (most recent last):',
    transcript,
    'Current slots (partial allowed):',
    JSON.stringify(state.slots),
    'Respond now with STRICT JSON only.'
  ].join('\n\n');

  const json = await chatJSON(system, user);
  const reply: string = (json?.reply ?? '').toString();
  const nextSlots: GoalsSlots = { ...state.slots, ...(json?.slots || {}) };
  const next: GoalsInterviewState = {
    messages: [...state.messages, { role: 'user', content: userText }, { role: 'assistant', content: reply }],
    slots: nextSlots
  };
  await saveGoalsInterview(next);
  return next;
}

export function slotsComplete(slots: GoalsSlots) {
  return !!(slots.primaryGoal && slots.daysPerWeek && slots.equipment);
}

export async function resetGoalsInterview() {
  await put('conversation', STORE_KEY, { messages: [], slots: {} } as GoalsInterviewState);
}
