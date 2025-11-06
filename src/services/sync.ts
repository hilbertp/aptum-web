import JSZip from 'jszip';
import { getAll } from './storage';
import { driveSync } from './driveSync';
import { genKey, encrypt, decrypt, exportRawKey, importRawKey } from './crypto';

const BUNDLE_NAME = 'aptum_bundle.enc';
const KEY_STORE = 'syncKey';

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(KEY_STORE);
  if (stored) {
    const buf = Uint8Array.from(atob(stored), c => c.charCodeAt(0)).buffer;
    return importRawKey(buf);
  }
  const k = await genKey();
  const raw = await exportRawKey(k);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
  localStorage.setItem(KEY_STORE, b64);
  return k;
}

export async function exportZip(): Promise<Blob> {
  const zip = new JSZip();
  const stores = ['profile','plan','planRevisions','sessions','trackingEvents','recoverySnapshots','blockers','conversation','scCache','settings'] as const;
  for (const s of stores) {
    const rows = await getAll<any>(s as any);
    zip.file(`${s}.json`, JSON.stringify(rows));
  }
  const content = await zip.generateAsync({ type: 'arraybuffer' });
  return new Blob([content], { type: 'application/zip' });
}

export async function syncUpload(): Promise<void> {
  if (!driveSync.hasToken) throw new Error('Not authenticated');
  const zip = await exportZip();
  const buf = new Uint8Array(await zip.arrayBuffer());
  const key = await getOrCreateKey();
  const enc = await encrypt(key, toArrayBuffer(buf));
  await driveSync.uploadOrUpdate(BUNDLE_NAME, new Blob([toArrayBuffer(enc)], { type: 'application/octet-stream' }));
}

export async function syncDownload(): Promise<Blob | undefined> {
  if (!driveSync.hasToken) throw new Error('Not authenticated');
  const blob = await driveSync.downloadByName(BUNDLE_NAME);
  if (!blob) return undefined;
  const key = await getOrCreateKey();
  const enc = new Uint8Array(await blob.arrayBuffer());
  const dec = await decrypt(key, enc);
  return new Blob([toArrayBuffer(dec)], { type: 'application/zip' });
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}
