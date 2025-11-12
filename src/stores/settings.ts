import { create } from 'zustand';
import { get, put } from '@/services/storage';

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
  setUnits: (u) => {
    set({ units: u });
    void put('settings', 'units', u);
  },
  setCap: (n) => {
    set({ defaultDailyCapMin: n });
    void put('settings', 'defaultDailyCapMin', n);
  }
}));

export async function hydrateSettings() {
  const units = await get<Units>('settings', 'units');
  const cap = await get<number>('settings', 'defaultDailyCapMin');
  const theme = await get<'light' | 'dark'>('settings', 'theme');
  useSettings.setState((prev) => ({
    units: (units as Units) || prev.units,
    defaultDailyCapMin: (cap as number) ?? prev.defaultDailyCapMin,
    theme: (theme as 'light' | 'dark') || prev.theme
  }));
}
