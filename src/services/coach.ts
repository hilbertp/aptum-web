import { get, put } from './storage';
import type { Plan, Profile } from '@/schemas/product';
import { search } from './retrieve';
import { chatJSON } from './llm';

export type InterviewAnswers = {
  primaryGoal: 'hypertrophy' | 'strength' | 'fat loss' | 'endurance' | 'mixed';
  daysPerWeek: number;
  equipment: string;
  constraints?: string;
};

export async function saveProfile(p: Profile) {
  await put('profile', 'me', p);
}

export async function loadProfile(): Promise<Profile | undefined> {
  return await get<Profile>('profile', 'me');
}

export async function generatePlanFromInterview(profile: Profile | undefined, ans: InterviewAnswers): Promise<Plan> {
  // Retrieve a small pack of KB snippets based on the goal
  const goalQuery = `${ans.primaryGoal} periodization weekly volume guidance`;
  let brief = '';
  try {
    const results = await search(goalQuery, { topK: 5 });
    brief = results.map((r, i) => `S${i + 1}: ${(r.text || '').slice(0, 500)}\nSource: ${r.title || r.sourceUrl || r.id}`).join('\n\n');
  } catch {
    // If retrieval fails (e.g., missing API key), proceed with no context
    brief = '';
  }

  const system = 'You are an elite strength & conditioning coach. Produce a mesocycle plan JSON that matches the provided Plan schema. Keep it realistic and concise.';
  const user = `Schema (TypeScript, keys only):
  Plan = {
    version: string;
    cycle: { weeks: number; startISO: string };
    priorities?: Record<string, number>;
    targets?: { strength?: Record<string, number>; sessions?: Record<string, number> };
    constraints?: { defaultDailyCapMin?: number };
    sources?: Array<{ id: string; title?: string; kind?: 'paper' | 'note' | 'video_note' | 'video_claim'; pmid?: string; videoId?: string; url?: string }>;
  }

User profile (optional): ${JSON.stringify(profile || {}, null, 2)}
Interview answers: ${JSON.stringify(ans, null, 2)}

Knowledge pack (snippets with citations):\n${brief}

Instructions:
- Output JSON ONLY matching the Plan schema.
- Set version to 'p_mesocycle'.
- Set cycle.weeks to 8 by default.
- Prioritize according to primaryGoal.
- Default constraints.defaultDailyCapMin to 60 unless the user hours are much lower.
- Include a compact sources array with the citations above (S1..S5 not required; use titles/urls).
`;

  let plan: Plan | null = null;
  try {
    const out = await chatJSON(system, user);
    plan = out as Plan;
  } catch {
    // fallback minimal plan if model not reachable or BYOK missing
    plan = {
      version: 'p_dev',
      cycle: { weeks: 8, startISO: new Date().toISOString().slice(0, 10) },
      priorities: { [ans.primaryGoal]: 1 },
      constraints: { defaultDailyCapMin: 60 }
    } as Plan;
  }
  await put('plan', 'current', plan);
  // Save a revision copy
  await put('planRevisions', Date.now(), { id: Date.now(), plan });
  return plan;
}

export async function loadPlan(): Promise<Plan | undefined> {
  return await get<Plan>('plan', 'current');
}
