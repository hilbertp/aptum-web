// Google Drive App Folder sync implementation

import { get, put, getAll } from './storage';
import { byok } from './byok';
import type { Profile } from './coach';
import type { GoalsInterviewState } from './interview';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export type SyncData = {
  profile?: Profile;
  interview?: GoalsInterviewState;
  settings?: any;
  apiKey?: string;
  plan?: any;
  lastSyncTime?: string;
};

export class DriveSyncService {
  private accessToken: string | null = null;
  status: SyncStatus = 'idle';

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  get hasToken() {
    return !!this.accessToken;
  }

  /**
   * List files in the appDataFolder
   */
  private async listFiles(nameContains?: string): Promise<any[]> {
    if (!this.accessToken) throw new Error('Not authenticated');

    let query = "spaces = 'appDataFolder'";
    if (nameContains) {
      query += ` and name = '${nameContains}'`;
    }

    const url = `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Upload or update a file in the appDataFolder
   */
  private async uploadFile(fileName: string, content: string): Promise<string> {
    if (!this.accessToken) throw new Error('Not authenticated');

    // Check if file already exists
    const existing = await this.listFiles(fileName);
    const fileId = existing.length > 0 ? existing[0].id : null;

    const metadata = {
      name: fileName,
      parents: ['appDataFolder']
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      closeDelimiter;

    const url = fileId
      ? `${UPLOAD_API_BASE}/files/${fileId}?uploadType=multipart`
      : `${UPLOAD_API_BASE}/files?uploadType=multipart`;

    const method = fileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Download a file from the appDataFolder
   */
  private async downloadFile(fileName: string): Promise<string | null> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const files = await this.listFiles(fileName);
    if (files.length === 0) {
      return null;
    }

    const fileId = files[0].id;
    const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Check if user has existing data on Drive (returning user)
   */
  async hasExistingData(): Promise<boolean> {
    try {
      const files = await this.listFiles('aptum-data.json');
      return files.length > 0;
    } catch (error) {
      console.error('Error checking for existing data:', error);
      return false;
    }
  }

  /**
   * Upload all app data to Drive
   */
  async uploadAllData(): Promise<void> {
    this.status = 'syncing';
    
    try {
      // Gather all data from IndexedDB and localStorage
      const profile = await get<Profile>('profile', 'me');
      const interview = await get<GoalsInterviewState>('conversation', 'interview:goals');
      const settings = await get('settings', 'user');
      const plan = await get('plan', 'current');
      const apiKeyData = byok.get();

      const syncData: SyncData = {
        profile,
        interview,
        settings,
        plan,
        apiKey: apiKeyData.apiKey || undefined,
        lastSyncTime: new Date().toISOString()
      };

      // Upload to Drive as a single JSON file
      await this.uploadFile('aptum-data.json', JSON.stringify(syncData, null, 2));
      
      this.status = 'idle';
    } catch (error) {
      this.status = 'error';
      console.error('Error uploading data:', error);
      throw error;
    }
  }

  /**
   * Download and restore all app data from Drive
   */
  async downloadAndRestoreData(): Promise<boolean> {
    this.status = 'syncing';
    
    try {
      const content = await this.downloadFile('aptum-data.json');
      
      if (!content) {
        this.status = 'idle';
        return false; // No data to restore
      }

      const syncData: SyncData = JSON.parse(content);

      // Restore data to IndexedDB and localStorage
      if (syncData.profile) {
        await put('profile', 'me', syncData.profile);
      }

      if (syncData.interview) {
        await put('conversation', 'interview:goals', syncData.interview);
      }

      if (syncData.settings) {
        await put('settings', 'user', syncData.settings);
      }

      if (syncData.plan) {
        await put('plan', 'current', syncData.plan);
      }

      if (syncData.apiKey) {
        await byok.set({ apiKey: syncData.apiKey });
      }

      this.status = 'idle';
      return true; // Successfully restored data
    } catch (error) {
      this.status = 'error';
      console.error('Error downloading/restoring data:', error);
      throw error;
    }
  }

  /**
   * Legacy methods for compatibility
   */
  async uploadObject(path: string, blob: Blob) {
    const content = await blob.text();
    await this.uploadFile(path, content);
    return { ok: true, path };
  }

  async downloadObject(fileId: string) {
    const content = await this.downloadFile(fileId);
    return content ? new Blob([content]) : new Blob();
  }
}

export const driveSync = new DriveSyncService();
