// Skeleton for Drive App Folder sync. Requires Google Identity Services OAuth token.

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export class DriveSyncService {
  private accessToken: string | null = null;
  status: SyncStatus = 'idle';

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  get hasToken() {
    return !!this.accessToken;
  }

  async uploadObject(path: string, _blob: Blob) {
    if (!this.accessToken) throw new Error('Not authenticated');
    // TODO: implement upload to Drive appDataFolder using multipart/related or uploadType=resumable
    // Placeholder: no-op
    return { ok: true, path };
  }

  async downloadObject(_fileId: string) {
    if (!this.accessToken) throw new Error('Not authenticated');
    // Placeholder
    return new Blob();
  }
}

export const driveSync = new DriveSyncService();
