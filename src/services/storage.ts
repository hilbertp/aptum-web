import { openDB, IDBPDatabase } from 'idb';

type Stores =
  | 'profile'
  | 'plan'
  | 'planRevisions'
  | 'sessions'
  | 'trackingEvents'
  | 'recoverySnapshots'
  | 'blockers'
  | 'conversation'
  | 'scCache'
  | 'settings';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB('aptum', 1, {
      upgrade(db) {
        db.createObjectStore('profile');
        db.createObjectStore('plan');
        db.createObjectStore('planRevisions', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('sessions');
        db.createObjectStore('trackingEvents');
        db.createObjectStore('recoverySnapshots');
        db.createObjectStore('blockers');
        db.createObjectStore('conversation');
        db.createObjectStore('scCache');
        db.createObjectStore('settings');
      }
    });
  }
  return dbPromise;
}

export async function put<T>(store: Stores, key: IDBValidKey, value: T) {
  const db = await getDB();
  await db.put(store, value as unknown, key);
}

export async function get<T>(store: Stores, key: IDBValidKey) {
  const db = await getDB();
  return (await db.get(store, key)) as T | undefined;
}

export async function getAll<T>(store: Stores) {
  const db = await getDB();
  return (await db.getAll(store)) as T[];
}

// Convenience helpers for common entities
export async function setProfile(v: any) {
  await put('profile', 'singleton', v);
}
export async function getProfile<T = any>() {
  return (await get<T>('profile', 'singleton')) || ({} as T);
}

export async function setSettings(v: any) {
  await put('settings', 'singleton', v);
}
export async function getSettings<T = any>() {
  return (await get<T>('settings', 'singleton')) || ({} as T);
}

export async function setCurrentPlan(plan: any) {
  await put('plan', plan.version, plan);
  const settings = (await getSettings()) as any;
  settings.currentPlanVersion = plan.version;
  await setSettings(settings);
}
export async function getCurrentPlan<T = any>() {
  const settings = (await getSettings()) as any;
  if (!settings.currentPlanVersion) return undefined as unknown as T | undefined;
  return (await get<T>('plan', settings.currentPlanVersion)) as T | undefined;
}

export async function saveSession(session: any) {
  await put('sessions', session.sessionId, session);
}
export async function getSessionById<T = any>(id: string) {
  return (await get<T>('sessions', id)) as T | undefined;
}

export async function listSessionsByDate<T = any>(dateISO: string) {
  const all = await getAll<any>('sessions');
  return all.filter((s) => s?.dateISO === dateISO) as T[];
}

export async function setSessionStatus(sessionId: string, status: 'planned'|'in_progress'|'aborted'|'completed') {
  const existing = await get<any>('sessions', sessionId);
  const next = { ...(existing || {}), sessionId, status };
  await put('sessions', sessionId, next);
}

export async function getSessionStatus(sessionId: string): Promise<'planned'|'in_progress'|'aborted'|'completed'|undefined> {
  const existing = await get<any>('sessions', sessionId);
  return existing?.status as any;
}

export async function upsertSessionPreservingStatus(session: any) {
  const existing = await get<any>('sessions', session.sessionId);
  const status = existing?.status ?? 'planned';
  await put('sessions', session.sessionId, { ...session, status });
}

export async function saveRecoverySnapshot(dateISO: string, snapshot: any) {
  await put('recoverySnapshots', dateISO, { ...snapshot, dateISO });
}
export async function getRecoverySnapshot<T = any>(dateISO: string) {
  return (await get<T>('recoverySnapshots', dateISO)) as T | undefined;
}

export async function listBlockers<T = any>() {
  return (await getAll<T>('blockers')) as T[];
}
export async function saveBlocker(blocker: any) {
  await put('blockers', blocker.id, blocker);
}
