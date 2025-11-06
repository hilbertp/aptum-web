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
    const sessionId = `${dateISO}__v_${plan.version}__seq_01`;
    const buildStrength = () => ([
      { type: 'warmup', items: ['bike 5min easy', 'hip openers'] },
      { type: 'main', exercises: [{ id: 'back_squat', sets: 4, reps: 5, rir: 2 }] },
      { type: 'accessory', exercises: [{ id: 'plank', sets: 3, timeSec: 60, rir: 2 }] },
      { type: 'cooldown', items: ['hamstring stretch', 'walk 5min'] }
    ]);
    const buildConditioning = () => ([
      { type: 'warmup', items: ['row 5min easy'] },
      { type: 'main', exercises: [{ id: 'airbike_intervals', sets: 10, timeSec: 30, rir: 3 }] },
      { type: 'accessory', exercises: [{ id: 'farmer_carry', sets: 4, timeSec: 45, rir: 3 }] },
      { type: 'cooldown', items: ['walk 5min'] }
    ]);
    const buildRecovery = () => ([
      { type: 'warmup', items: ['walk 5-10min easy'] },
      { type: 'recovery', items: ['breathing 5min', 'mobility flow 10min'] },
      { type: 'cooldown', items: ['gentle stretch 5min'] }
    ]);

    const blocks = focus === 'Conditioning' ? buildConditioning() : focus === 'Recovery' ? buildRecovery() : buildStrength();
    const session: Session = { sessionId, dateISO, lengthMin: capMin, focus, blocks } as Session;
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
        const bydays = m && m[1] ? m[1].split(',') : [];
        if (bydays.length) {
          const map = ['SU','MO','TU','WE','TH','FR','SA'];
          const dow = map[date.getDay()] as string;
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

    // Compute weekly focus distribution from plan priorities
    const p = plan.priorities || { strength: 1, conditioning: 1 } as any;
    const totalW = (p.strength || 1) + (p.conditioning || 1);
    let nStrength = Math.max(1, Math.min(6, Math.round((p.strength || 1) * 7 / totalW)));
    let nConditioning = 7 - nStrength;
    const focusPool: string[] = [];
    while (nStrength-- > 0) focusPool.push('Strength');
    while (nConditioning-- > 0) focusPool.push('Conditioning');
    // spread across week by alternating from ends
    const weeklyFocus: string[] = new Array(7);
    let left = 0, right = 6, idx = 0;
    focusPool.sort((a,b)=> a.localeCompare(b)); // stable order
    for (const f of focusPool) {
      weeklyFocus[idx % 2 === 0 ? left++ : right--] = f;
      idx++;
    }

    const startDate = new Date(startISO);
    const weekNum = Math.floor((startDate.getTime() - new Date(plan.cycle.startISO).getTime()) / (7*24*60*60*1000)) + 1;
    const isDeload = plan.cycle.weeks >= 4 && weekNum % 4 === 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);

      const isBlocked = blockers.some((b: any) => occursOn(b.rrule, d) || b.type === 'RecoveryDay' || b.fatigue === 'High');
      const readiness = recovery?.systemic?.readiness ?? 80;
      const cap = adjustCap(capMin, readiness);

      if (isBlocked || readiness <= 25) {
        const s = await this.generateSession({ dateISO: iso, plan, recovery, capMin: Math.max(25, Math.round(cap * 0.5)), focus: 'Recovery' });
        // override blocks for a true recovery template
        s.policy = { ...(s.policy||{}), blocked: isBlocked, readiness };
        out.push(s);
      } else {
        const baseFocus = weeklyFocus[i] || 'Strength';
        const s = await this.generateSession({ dateISO: iso, plan, recovery, capMin: isDeload ? Math.round(cap * 0.8) : cap, focus: baseFocus });
        if (isDeload && s.blocks) {
          // reduce sets by ~40% for deload
          s.blocks = s.blocks.map((b: any) => b.exercises ? { ...b, exercises: b.exercises.map((ex: any)=> ({ ...ex, sets: Math.max(1, Math.round((ex.sets ?? 1)*0.6)) })) } : b );
          s.policy = { ...(s.policy||{}), deload: true };
        }
        out.push(s);
      }
    }
    return out;
  }
};
