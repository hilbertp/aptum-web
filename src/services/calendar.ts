export type BlockerType = 'RecoveryDay' | 'GameDay' | 'TeamPractice' | 'Appointment';

export type Blocker = {
  id: string;
  type: BlockerType;
  fatigue: 'None' | 'Low' | 'Medium' | 'High';
  rrule?: string;
  window?: { startLocal: string; endLocal: string };
};

export interface CalendarService {
  isBlocked(dateISO: string): boolean;
}

export const calendar: CalendarService = {
  isBlocked(_dateISO) {
    return false;
  }
};
