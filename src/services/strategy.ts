import type { SessionContext } from './orchestrator';
import { PlanSchema, type Plan } from '@/schemas/product';
import { chatJson } from '@/services/llm';
import { getAIKey } from '@/services/byok';

export interface StrategyService {
  proposePlan(sc: SessionContext): Promise<Plan>;
  acceptPlan(plan: Plan): Promise<Plan>;
}

export const strategy: StrategyService = {
  async proposePlan(_sc) {
    const today = new Date().toISOString().slice(0, 10);
    const hasKey = !!getAIKey();
    if (hasKey) {
      try {
        const prompt = `You are Aptum's training strategy engine. Produce a minimal JSON plan for an athlete. 
Return ONLY JSON matching this TypeScript shape (no extra fields):
{
  "version": string,
  "cycle": { "weeks": number, "startISO": string },
  "priorities"?: { [key: string]: number },
  "targets"?: { "strength"?: { [key: string]: number }, "sessions"?: { [key: string]: number } },
  "constraints"?: { "defaultDailyCapMin"?: number }
}
Constraints:
- version: set to "p_ai"
- cycle.startISO: set to "${today}"
- cycle.weeks: 6 to 12 (pick 8 if unsure)
- constraints.defaultDailyCapMin: 45 to 90 (pick 60 if unsure)
- Prefer priorities: strength: 1, conditioning: 2 (and you may include others)
`; 
        const json = await chatJson(prompt, 0.2);
        const parsed = PlanSchema.safeParse(json);
        if (parsed.success) {
          return parsed.data as Plan;
        }
        console.warn('LLM plan failed validation, falling back', parsed.error?.message);
      } catch (e) {
        console.warn('LLM plan generation failed, falling back:', (e as any)?.message || e);
      }
    }
    // Fallback local baseline plan
    const plan: Plan = {
      version: 'p_dev',
      cycle: { weeks: 8, startISO: today },
      priorities: { strength: 1, conditioning: 2 },
      constraints: { defaultDailyCapMin: 60 }
    };
    return plan;
  },
  async acceptPlan(plan) {
    return { ...plan, acceptedAt: new Date().toISOString() };
  }
};
