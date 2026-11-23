import { SEED_DB } from './seed';

/*
 * Private, per-origin IndexedDB storage for demonstration records.
 * If the browser blocks IndexedDB, an in-memory fallback keeps the app usable.
 */
const DB_NAME = 'swasthyasetu-ai';
const DB_VERSION = 1;
export const STORES = ['patients', 'consultations', 'referrals', 'reviews', 'syncQueue', 'auditLog', 'meta'];

let dbPromise = null;
const memory = Object.fromEntries(STORES.map((store) => [store, new Map()]));
let useMemory = false;

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      useMemory = true;
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      useMemory = true;
      resolve(null);
    };
    request.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function tx(db, store, mode, run) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const objectStore = transaction.objectStore(store);
    let result;
    try {
      result = run(objectStore);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result?.result ?? result);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAll(store) {
  const db = await openDatabase();
  if (!db || useMemory) return [...memory[store].values()];
  return tx(db, store, 'readonly', (os) => os.getAll());
}

export async function get(store, id) {
  const db = await openDatabase();
  if (!db || useMemory) return memory[store].get(id) || null;
  return tx(db, store, 'readonly', (os) => os.get(id));
}

export async function put(store, value) {
  const db = await openDatabase();
  if (!db || useMemory) {
    memory[store].set(value.id, value);
    return value;
  }
  await tx(db, store, 'readwrite', (os) => os.put(value));
  return value;
}

export async function remove(store, id) {
  const db = await openDatabase();
  if (!db || useMemory) {
    memory[store].delete(id);
    return;
  }
  await tx(db, store, 'readwrite', (os) => os.delete(id));
}

export async function putMany(store, values) {
  await Promise.all(values.map((value) => put(store, value)));
}

export async function seedDatabase() {
  const db = await openDatabase();
  const existing = await get('meta', 'seeded');
  if (existing?.value) return false;

  if (!db || useMemory) {
    Object.entries(SEED_DB).forEach(([store, values]) => {
      values.forEach((value) => memory[store].set(value.id, value));
    });
  } else {
    await Promise.all(Object.entries(SEED_DB).map(([store, values]) => putMany(store, values)));
  }
  await put('meta', { id: 'seeded', value: true, at: new Date().toISOString() });
  return true;
}

export async function resetDatabase() {
  const db = await openDatabase();
  if (!db || useMemory) {
    Object.keys(memory).forEach((store) => memory[store].clear());
  } else {
    await Promise.all(STORES.map((store) => tx(db, store, 'readwrite', (os) => os.clear())));
  }
  await seedDatabase();
}

export function isUsingMemoryFallback() {
  return useMemory;
}
