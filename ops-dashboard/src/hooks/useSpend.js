import { useEffect, useRef, useState } from 'react';
import { newSpend, mergePersonalSpend } from '../store.js';
import {
  readSpendCache,
  writeSpendCache,
  fetchPersonalSpend,
  insertSpendRow,
  updateSpendRow,
  deleteSpendRow,
  upsertSpendRows,
} from '../sync.js';

// Same cache-first + fetch-on-focus + optimistic-mutation pattern as
// useTasks — see that file for the fuller explanation.
export function useSpend() {
  const [personalSpend, setPersonalSpend] = useState(() => readSpendCache());
  const [syncState, setSyncState] = useState('loading');
  const spendRef = useRef(personalSpend);

  const persist = (next) => {
    spendRef.current = next;
    setPersonalSpend(next);
    writeSpendCache(next);
  };

  const markSynced = () => setSyncState('synced');
  const markOffline = (e) => {
    console.error('Supabase spend sync failed', e);
    setSyncState('offline');
  };

  // First fetch is merged, not overwritten — see useTasks.js for why
  // (it races an optimistic add/edit made in the second or two before it
  // resolves). Later syncs overwrite outright so remote deletes/edits
  // still take effect.
  const hasSyncedOnceRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        const fresh = await fetchPersonalSpend();
        if (cancelled) return;
        persist(hasSyncedOnceRef.current ? fresh : mergePersonalSpend(spendRef.current, fresh));
        hasSyncedOnceRef.current = true;
        markSynced();
      } catch (e) {
        if (!cancelled) markOffline(e);
      }
    };
    sync();
    const onVisible = () => {
      if (!document.hidden) sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', sync);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSpend = (data) => {
    const entry = newSpend(data);
    persist([...spendRef.current, entry]);
    insertSpendRow(entry).then(markSynced).catch(markOffline);
  };

  const updateSpend = (id, patch) => {
    persist(spendRef.current.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    updateSpendRow(id, patch).then(markSynced).catch(markOffline);
  };

  const deleteSpend = (id) => {
    persist(spendRef.current.filter((e) => e.id !== id));
    deleteSpendRow(id).then(markSynced).catch(markOffline);
  };

  const importMergeSpend = (imported) => {
    persist(mergePersonalSpend(spendRef.current, imported));
    upsertSpendRows(imported).then(markSynced).catch(markOffline);
  };

  return { personalSpend, addSpend, updateSpend, deleteSpend, importMergeSpend, syncState };
}
