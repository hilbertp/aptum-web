import { create } from 'zustand';

type Units = 'metric' | 'imperial';

type SettingsState = {
  units: Units;
  defaultDailyCapMin: number;
  theme: 'light' | 'dark';
  setUnits: (u: Units) => void;
  setCap: (n: number) => void;
};

export const useSettings = create<SettingsState>((set) => ({
  units: 'metric',
  defaultDailyCapMin: 60,
  theme: 'light',
  setUnits: (u) => set({ units: u }),
  setCap: (n) => set({ defaultDailyCapMin: n })
}));
