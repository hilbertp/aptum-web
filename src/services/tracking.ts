export type SetEvent = { eventId: string; sessionId: string; ex: number; set: number; reps?: number; timeSec?: number; load?: { kg?: number; lb?: number }; rir?: number; ts: number };
export type SessionStatusEvent = { eventId: string; sessionId: string; status: 'in_progress'|'aborted'|'completed'; ts: number };

export interface TrackingService {
  logSet(ev: SetEvent): Promise<void>;
  logSessionStatus(ev: SessionStatusEvent): Promise<void>;
}

import { put } from '@/services/storage';

export const tracking: TrackingService = {
  async logSet(ev) {
    await put('trackingEvents', ev.eventId, ev);
  },
  async logSessionStatus(ev) {
    await put('trackingEvents', ev.eventId, ev);
  }
};
