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
