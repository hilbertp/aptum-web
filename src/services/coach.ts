import { get, put } from './storage';
import type { Plan, Profile, EnhancedPlan, PeriodizationModel } from '@/schemas/product';
import { search } from './retrieve';
import { chatJSON } from './llm';
import { MODELS } from './periodization';
import { driveSync } from './driveSync';

// Re-export Profile type for use in other services
export type { Profile };

export type InterviewAnswers = {
  primaryGoal: 'hypertrophy' | 'strength' | 'fat loss' | 'endurance' | 'mixed';
  daysPerWeek: number;
  equipment: string;
  constraints?: string;
};

export async function saveProfile(p: Profile) {
  await put('profile', 'me', p);
  // Sync to Drive if authenticated
  if (driveSync.hasToken) {
    try {
      await driveSync.uploadAllData();
    } catch (error) {
      console.error('Failed to sync profile to Drive:', error);
    }
  }
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
  
  // Sync to Drive if authenticated
  if (driveSync.hasToken) {
    try {
      await driveSync.uploadAllData();
    } catch (error) {
      console.error('Failed to sync plan to Drive:', error);
    }
  }
  
  return plan;
}

export async function loadPlan(): Promise<Plan | undefined> {
  return await get<Plan>('plan', 'current');
}

/**
 * Strategy Review Result
 */
export type StrategyReview = {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{
    field: string;
    currentValue: any;
    suggestedValue: any;
    reason: string;
  }>;
  alternativeModels?: PeriodizationModel[];
  warnings?: string[];
};

/**
 * Review the current strategy and provide AI-powered recommendations
 */
export async function reviewCurrentStrategy(plan: Partial<EnhancedPlan>, profile?: Profile): Promise<StrategyReview> {
  // Retrieve KB based on current plan configuration
  let snippets: string[] = [];
  try {
    const focusAreas = plan.focusAreas?.value || [];
    const model = plan.periodizationModel?.value || 'unknown';
    const query = `${focusAreas.join(' ')} ${model} periodization longevity training review`;
    const results = await search(query, { topK: 5 });
    snippets = results.map((r, i) => `[${i + 1}] ${(r.text || '').slice(0, 600)}\nSource: ${r.title || r.sourceUrl || r.id}`).filter(Boolean);
  } catch {
    // Proceed without KB if retrieval fails
  }

  const kbContext = snippets.length 
    ? `Knowledge base references:\n${snippets.join('\n\n')}`
    : 'No knowledge base context available.';

  const currentModel = plan.periodizationModel?.value;
  const modelInfo = currentModel ? MODELS[currentModel] : null;

  const system = [
    'You are an elite strength & conditioning coach reviewing a mesocycle training strategy.',
    'Analyze the plan for effectiveness, safety, and alignment with longevity principles.',
    'Provide specific, actionable feedback.',
    '',
    'AVAILABLE PERIODIZATION MODELS:',
    ...Object.entries(MODELS).map(([key, model]) => 
      `- ${key}: ${model.name} - ${model.description} (Best for: ${model.bestFor.join(', ')})`
    ),
    '',
    'Respond with STRICT JSON matching this structure:',
    '{',
    '  "analysis": "Overall assessment of the strategy (2-3 sentences)",',
    '  "strengths": ["strength 1", "strength 2", ...],',
    '  "weaknesses": ["weakness 1", "weakness 2", ...],',
    '  "suggestions": [',
    '    {',
    '      "field": "fieldName",',
    '      "currentValue": current_value,',
    '      "suggestedValue": suggested_value,',
    '      "reason": "Why this change would improve the plan"',
    '    }',
    '  ],',
    '  "alternativeModels": ["model_key_1", "model_key_2"] (optional, only if current model is suboptimal),',
    '  "warnings": ["warning 1", ...] (optional, serious concerns only)',
    '}',
    '',
    kbContext
  ].join('\n');

  const user = [
    'Current Mesocycle Plan:',
    JSON.stringify({
      weeksPlanned: plan.weeksPlanned?.value,
      sessionsPerWeek: plan.sessionsPerWeek?.value,
      focusAreas: plan.focusAreas?.value,
      buildToDeloadRatio: plan.buildToDeloadRatio?.value,
      periodizationModel: plan.periodizationModel?.value,
      sessionAllocations: plan.sessionAllocations?.value
    }, null, 2),
    '',
    currentModel && modelInfo ? `Current Model: ${modelInfo.name}
Description: ${modelInfo.description}
Best For: ${modelInfo.bestFor.join(', ')}` : '',
    '',
    'Athlete Profile:',
    JSON.stringify(profile || {}, null, 2),
    '',
    'Provide a comprehensive strategy review with specific, actionable suggestions.',
    'Focus on longevity, sustainability, and effectiveness.',
    'ONLY suggest alternative models if the current model is clearly inappropriate for the athlete.',
    'Respond with STRICT JSON only.'
  ].join('\n');

  try {
    const json = await chatJSON(system, user);
    return {
      analysis: json.analysis || 'Strategy review completed.',
      strengths: json.strengths || [],
      weaknesses: json.weaknesses || [],
      suggestions: json.suggestions || [],
      alternativeModels: json.alternativeModels || [],
      warnings: json.warnings || []
    };
  } catch (error) {
    // Fallback if AI unavailable
    return {
      analysis: 'AI strategy review is temporarily unavailable. Please ensure your API key is configured.',
      strengths: [],
      weaknesses: [],
      suggestions: [],
      warnings: ['Could not complete AI review. Check your API key configuration.']
    };
  }
}
