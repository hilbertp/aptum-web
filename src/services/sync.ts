import JSZip from 'jszip';
import { getAll, getDB } from './storage';
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

export async function importLocalZip(file: Blob): Promise<void> {
  const zip = await JSZip.loadAsync(file);
  // Helper to parse JSON safely
  const parse = async (name: string) => {
    const f = zip.file(name);
    if (!f) return [] as any[];
    const txt = await f.async('string');
    try { return JSON.parse(txt); } catch { return [] as any[]; }
  };
  const db = await getDB();
  const writeAll = async (store: string, items: any[], keyer: (x:any, i:number)=>IDBValidKey) => {
    const tx = db.transaction(store, 'readwrite');
    await tx.store.clear();
    for (let i=0;i<items.length;i++) {
      const it = items[i];
      await tx.store.put(it, keyer(it, i));
    }
    await tx.done;
  };

  const profile = await parse('profile.json');
  if (profile?.length) await writeAll('profile', profile, (_x)=>'singleton');
  const plans = await parse('plan.json');
  if (plans?.length) await writeAll('plan', plans, (x)=>x?.version ?? crypto.randomUUID());
  const planRevs = await parse('planRevisions.json');
  if (planRevs?.length) await writeAll('planRevisions', planRevs, (x, i)=>x?.id ?? i+1);
  const sessions = await parse('sessions.json');
  if (sessions?.length) await writeAll('sessions', sessions, (x)=>x?.sessionId ?? crypto.randomUUID());
  const tracking = await parse('trackingEvents.json');
  if (tracking?.length) await writeAll('trackingEvents', tracking, (x)=>x?.eventId ?? crypto.randomUUID());
  const recs = await parse('recoverySnapshots.json');
  if (recs?.length) await writeAll('recoverySnapshots', recs, (x)=>x?.dateISO ?? crypto.randomUUID());
  const blockers = await parse('blockers.json');
  if (blockers?.length) await writeAll('blockers', blockers, (x)=>x?.id ?? crypto.randomUUID());
  const conv = await parse('conversation.json');
  if (conv?.length) await writeAll('conversation', conv, (_x,i)=>i);
  const sc = await parse('scCache.json');
  if (sc?.length) await writeAll('scCache', sc, (_x,i)=>i);
  const settings = await parse('settings.json');
  if (settings?.length) await writeAll('settings', [settings[settings.length-1]], (_x)=>'singleton');
}
