import type { Plan, Recovery, Session } from '@/schemas/product';

export interface ExerciseService {
  generateSession(input: {
    dateISO: string;
    plan: Plan;
    recovery: Recovery;
    capMin: number;
    focus?: string;
  }): Promise<Session>;
  generateWeekAndValidate(input: {
    startISO: string; // Monday or today
    plan: Plan;
    recovery: Recovery;
    capMin: number;
  }): Promise<Session[]>;
}

export const exercise: ExerciseService = {
  async generateSession({ dateISO, plan, capMin, focus = 'Strength' }) {
    const session: Session = {
      sessionId: `${dateISO}__v_${plan.version}__seq_01`,
      dateISO,
      lengthMin: capMin,
      focus,
      blocks: [
        { type: 'warmup', items: ['bike 5min easy', 'hip openers'] },
        { type: 'main', exercises: [{ id: 'back_squat', sets: 4, reps: 5, rir: 2 }] },
        { type: 'accessory', exercises: [{ id: 'plank', sets: 3, timeSec: 60, rir: 2 }] },
        { type: 'cooldown', items: ['hamstring stretch', 'walk 5min'] }
      ]
    } as Session;
    return session;
  },
  async generateWeekAndValidate({ startISO, plan, recovery, capMin }) {
    // MVP: generate 7 consecutive sessions using generateSession
    const start = new Date(startISO);
    const out: Session[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const s = await this.generateSession({ dateISO: iso, plan, recovery, capMin });
      out.push(s);
    }
    return out;
  }
};
