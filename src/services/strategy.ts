import type { SessionContext } from './orchestrator';
import type { Plan } from '@/schemas/product';

export interface StrategyService {
  proposePlan(sc: SessionContext): Promise<Plan>;
  acceptPlan(plan: Plan): Promise<Plan>;
}

export const strategy: StrategyService = {
  async proposePlan(_sc) {
    const plan: Plan = {
      version: 'p_dev',
      cycle: { weeks: 8, startISO: new Date().toISOString().slice(0, 10) },
      priorities: { strength: 1, conditioning: 2 },
      constraints: { defaultDailyCapMin: 60 }
    };
    return plan;
  },
  async acceptPlan(plan) {
    return { ...plan, acceptedAt: new Date().toISOString() };
  }
};
