export type SetEvent = { eventId: string; sessionId: string; ex: number; set: number; reps?: number; load?: { kg?: number; lb?: number }; rir?: number; ts: number };

export interface TrackingService {
  logSet(ev: SetEvent): Promise<void>;
}

export const tracking: TrackingService = {
  async logSet(_ev) {
    // TODO: write to IndexedDB and queue for Drive sync
  }
};
