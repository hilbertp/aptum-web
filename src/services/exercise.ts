import type { Plan, Recovery, Session } from '@/schemas/product';
import { listBlockers } from '@/services/storage';
import { RRule } from 'rrule';

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
    const start = new Date(startISO);
    const out: Session[] = [];
    const blockers = await listBlockers<any>();

    const occursOn = (rruleStr: string | undefined, date: Date) => {
      if (!rruleStr) return false;
      try {
        // Fast path: BYDAY weekly match without heavy iteration
        const m = rruleStr.match(/BYDAY=([^;]+)/);
        if (m) {
          const bydays = m[1].split(',');
          const map = ['SU','MO','TU','WE','TH','FR','SA'];
          const dow = map[date.getDay()];
          if (bydays.includes(dow)) return true;
        }
        const r = RRule.fromString(rruleStr);
        const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(date); endOfDay.setHours(23,59,59,999);
        const between = r.between(startOfDay, endOfDay, true);
        return between.length > 0;
      } catch {
        return false;
      }
    };

    const adjustCap = (base: number, readiness: number) => {
      if (readiness <= 30) return Math.max(20, Math.round(base * 0.5));
      if (readiness <= 50) return Math.round(base * 0.75);
      if (readiness >= 85) return Math.round(base * 1.25);
      return base;
    };

    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);

      const isBlocked = blockers.some((b: any) => occursOn(b.rrule, d) || b.type === 'RecoveryDay' || b.fatigue === 'High');
      const readiness = recovery?.systemic?.readiness ?? 80;
      const cap = adjustCap(capMin, readiness);

      if (isBlocked || readiness <= 25) {
        const s = await this.generateSession({ dateISO: iso, plan, recovery, capMin: Math.max(25, Math.round(cap * 0.5)), focus: 'Recovery' });
        // override blocks for a true recovery template
        s.blocks = [
          { type: 'warmup', items: ['walk 5-10min easy'] },
          { type: 'recovery', items: ['breathing 5min', 'mobility flow 10min'] },
          { type: 'cooldown', items: ['gentle stretch 5min'] }
        ];
        out.push(s);
      } else {
        const s = await this.generateSession({ dateISO: iso, plan, recovery, capMin: cap });
        out.push(s);
      }
    }
    return out;
  }
};
