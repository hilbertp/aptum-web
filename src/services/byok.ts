import { driveSync } from './driveSync';

export type ByokConfig = {
  apiKey: string | null;
};

const LS_KEYS = {
  apiKey: 'byok.apiKey'
};

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const byok = {
  get(): ByokConfig {
    const ls = safeLocalStorage();
    const apiKey = (ls?.getItem(LS_KEYS.apiKey) || null);
    return { apiKey };
  },
  async set(cfg: Partial<ByokConfig>): Promise<void> {
    const ls = safeLocalStorage();
    if (!ls) return;
    if (cfg.apiKey !== undefined) ls.setItem(LS_KEYS.apiKey, cfg.apiKey || '');
    
    // Sync to Drive if authenticated
    if (driveSync.hasToken) {
      try {
        await driveSync.uploadAllData();
      } catch (error) {
        console.error('Failed to sync API key to Drive:', error);
      }
    }
  },
  clear(): void {
    const ls = safeLocalStorage();
    if (!ls) return;
    Object.values(LS_KEYS).forEach(k => ls.removeItem(k));
  }
};
