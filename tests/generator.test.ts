import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startOfWeek, format } from 'date-fns';
import type { Plan, Recovery } from '@/schemas/product';

const plan: Plan = {
  version: 'p_test',
  cycle: { weeks: 8, startISO: '2025-11-03' },
  constraints: { defaultDailyCapMin: 60 }
};

const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

describe('exercise.generateWeekAndValidate', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('generates 7 sessions starting Monday with weighted focus when unblocked', async () => {
    vi.mock('@/services/storage', async () => ({ listBlockers: async () => [] }));
    const recovery: Recovery = { systemic: { readiness: 80 } } as any;
    const priPlan: Plan = { ...plan, priorities: { strength: 2, conditioning: 5 } } as any;
    const { exercise } = await import('@/services/exercise');
    const out = await exercise.generateWeekAndValidate({ startISO: monday, plan: priPlan, recovery, capMin: 60 });
    expect(out).toHaveLength(7);
    const condDays = out.filter(s => s.focus === 'Conditioning').length;
    expect(condDays).toBeGreaterThanOrEqual(3);
  });

  it('scales cap down for low readiness', async () => {
    vi.mock('@/services/storage', async () => ({ listBlockers: async () => [] }));
    const recovery: Recovery = { systemic: { readiness: 25 } } as any;
    const { exercise } = await import('@/services/exercise');
    const out = await exercise.generateWeekAndValidate({ startISO: monday, plan, recovery, capMin: 60 });
    expect(out[0].focus).toBe('Recovery');
    expect(out[0].lengthMin).toBe(25); // minimum cap for recovery days
  });
});
