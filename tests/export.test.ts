import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';

describe('exportZip', () => {
  it('creates a zip with store json files', async () => {
    vi.mock('@/services/storage', async () => ({
      getAll: async (store: string) => {
        if (store === 'sessions') return [{ sessionId: 's1', dateISO: '2025-11-06' }];
        if (store === 'settings') return [{ currentPlanVersion: 'p_dev' } as any];
        return [];
      }
    }));
    const { exportZip: exp } = await import('@/services/sync');
    const blob = await exp();
    const ab = await (blob as any).arrayBuffer();
    const zip = await JSZip.loadAsync(ab);
    // Must contain expected filenames
    const names = Object.keys(zip.files);
    expect(names).toContain('sessions.json');
    expect(names).toContain('settings.json');
  });
});
