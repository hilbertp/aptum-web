export type SetEvent = { eventId: string; sessionId: string; ex: number; set: number; reps?: number; timeSec?: number; load?: { kg?: number; lb?: number }; rir?: number; ts: number };

export interface TrackingService {
  logSet(ev: SetEvent): Promise<void>;
}

import { put } from '@/services/storage';

export const tracking: TrackingService = {
  async logSet(ev) {
    await put('trackingEvents', ev.eventId, ev);
  }
};
