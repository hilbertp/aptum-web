import type { SessionContext } from './orchestrator';
import type { Plan } from '@/schemas/product';
import { search as kbSearch } from './retrieve';

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
    // Best-effort: attach relevant KB sources for transparency
    try {
      const q = _sc?.summary?.trim() && _sc.summary !== 'Local development session context' ? _sc.summary : 'training periodization and load management';
      const results = await kbSearch(q, { topK: 5, filters: { kinds: ['paper', 'note', 'video_claim', 'video_note'] } });
      plan.sources = results.map(r => ({
        id: (r.id as string) || 'kb:unknown',
        kind: r.kind,
        title: r.title,
        pmid: r.pmid,
        videoId: r.videoId,
        url: r.sourceUrl
      }));
    } catch {
      // ignore retrieval errors; plan remains valid
    }
    return plan;
  },
  async acceptPlan(plan) {
    return { ...plan, acceptedAt: new Date().toISOString() };
  }
};
