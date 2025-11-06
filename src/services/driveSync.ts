// DriveSyncService: Encrypted sync to Google Drive appDataFolder
// Minimal MVP: upload and download a single encrypted bundle (zip of stores)

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export class DriveSyncService {
  private accessToken: string | null = null;
  status: SyncStatus = 'idle';

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  get hasToken() {
    return !!this.accessToken;
  }

  private authHeaders() {
    if (!this.accessToken) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  async findFileByName(name: string) {
    const q = encodeURIComponent(`name = '${name}' and 'appDataFolder' in parents`);
    const res = await fetch(`${DRIVE_FILES_URL}?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`, {
      headers: { ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
    const data = await res.json();
    return (data.files?.[0]) as { id: string; name: string } | undefined;
  }

  async uploadOrUpdate(name: string, blob: Blob, mime = 'application/octet-stream') {
    const meta = { name, parents: ['appDataFolder'] };
    const boundary = 'ii-aptum-boundary-' + Math.random().toString(36).slice(2);
    const body = `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(meta) + '\r\n' +
      `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`;
    const trailer = `\r\n--${boundary}--`;
    const form = new Blob([body, blob, trailer], { type: `multipart/related; boundary=${boundary}` });

    const existing = await this.findFileByName(name);
    const url = existing ? `${DRIVE_UPLOAD_URL}/${existing.id}?uploadType=multipart` : `${DRIVE_UPLOAD_URL}?uploadType=multipart`;
    const method = existing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { ...this.authHeaders() }, body: form });
    if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
    return await res.json();
  }

  async downloadByName(name: string) {
    const f = await this.findFileByName(name);
    if (!f) return undefined;
    const res = await fetch(`${DRIVE_FILES_URL}/${f.id}?alt=media`, { headers: { ...this.authHeaders() } });
    if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
    return await res.blob();
  }
}

export const driveSync = new DriveSyncService();
