import { nowIso } from '../utils/id';

/*
 * Mock synchronization service. Replace with authenticated FastAPI endpoints
 * when a backend is available. The queue itself is persisted in IndexedDB.
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function synchronizeQueue(queue, { online, retryFailedOnly = false } = {}) {
  await wait(700);
  if (!online) {
    return {
      online: false,
      updated: queue.map((item) => (
        retryFailedOnly && item.status === 'Sync Failed'
          ? { ...item, status: 'Sync Failed', attempts: item.attempts + 1, lastAttempt: nowIso(), error: 'No network connection' }
          : item
      )),
      synced: 0,
      failed: 0,
      message: 'Device is offline. Records remain safely saved locally.',
    };
  }

  const eligible = (item) => (
    retryFailedOnly ? item.status === 'Sync Failed' : item.status !== 'Synchronized'
  );
  let synced = 0;
  const updated = queue.map((item) => {
    if (!eligible(item)) return item;
    // One seeded item demonstrates a recoverable failure on the first pass.
    if (item.id === 'sq-4' && item.attempts < 3 && retryFailedOnly) {
      return { ...item, attempts: item.attempts + 1, status: 'Sync Failed', lastAttempt: nowIso(), error: 'Simulated network timeout' };
    }
    synced += 1;
    return {
      ...item,
      status: 'Synchronized',
      attempts: retryFailedOnly ? item.attempts + 1 : item.attempts,
      lastAttempt: nowIso(),
      error: null,
    };
  });

  return {
    online: true,
    updated,
    synced,
    failed: 0,
    message: synced ? `${synced} record${synced === 1 ? '' : 's'} synchronized with the demonstration server.` : 'No records were waiting for synchronization.',
  };
}
