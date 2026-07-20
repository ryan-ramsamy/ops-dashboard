import { useEffect, useRef, useState } from 'react';
import { newTask, rolloverTasks, mergeTasks } from '../store.js';
import { localToday, addInterval } from '../dates.js';
import {
  readTasksCache,
  writeTasksCache,
  fetchTasks,
  insertTaskRow,
  updateTaskRow,
  deleteTaskRow,
  upsertTaskRows,
} from '../sync.js';

// syncState: 'loading' (first fetch in flight) | 'synced' | 'offline'
// (last Supabase call failed — local state/cache is still authoritative
// for what you see, it just hasn't reached the server yet).
export function useTasks() {
  const [tasks, setTasks] = useState(() => rolloverTasks(readTasksCache()));
  const [syncState, setSyncState] = useState('loading');
  const tasksRef = useRef(tasks);

  // Writes local state, the offline cache, and the ref in lockstep so
  // synchronous follow-up reads within the same handler (e.g. the
  // recurrence spawn-guard in toggleDone) see the just-applied change
  // instead of a stale pre-render snapshot.
  const persist = (next) => {
    tasksRef.current = next;
    setTasks(next);
    writeTasksCache(next);
  };

  const markSynced = () => setSyncState('synced');
  const markOffline = (e) => {
    console.error('Supabase task sync failed', e);
    setSyncState('offline');
  };

  // Cache-first paint, then reconcile with Supabase — on mount and again
  // whenever the tab regains focus/visibility (covers switching back
  // from another device/tab without leaving this one open).
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        const fresh = rolloverTasks(await fetchTasks());
        if (cancelled) return;
        persist(fresh);
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

  // Local-only rollover check every minute, independent of network — so
  // "Nd overdue" stays accurate through midnight during a long-open tab
  // even without a fresh Supabase fetch.
  useEffect(() => {
    const timer = setInterval(() => {
      const next = rolloverTasks(tasksRef.current);
      if (next !== tasksRef.current) persist(next);
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const addTask = (data) => {
    const task = newTask(data);
    persist([...tasksRef.current, task]);
    insertTaskRow(task).then(markSynced).catch(markOffline);
    return task;
  };

  const updateTask = (id, patch) => {
    persist(tasksRef.current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    updateTaskRow(id, patch).then(markSynced).catch(markOffline);
  };

  // Completing a recurring task spawns its next occurrence with the same
  // details, dated one interval on (from the current due date, which
  // rollover has already pulled to today if it was overdue). Un-completing
  // does NOT retract an already-spawned occurrence — but re-completing
  // won't spawn a duplicate either, thanks to the same-title/same-date guard.
  const toggleDone = (id) => {
    const current = tasksRef.current;
    const t = current.find((x) => x.id === id);
    if (!t) return;

    if (t.done) {
      updateTask(id, { done: false, completedAt: null });
      return;
    }

    const today = localToday();
    const next = current.map((x) => (x.id === id ? { ...x, done: true, completedAt: today } : x));
    persist(next);
    updateTaskRow(id, { done: true, completedAt: today }).then(markSynced).catch(markOffline);

    if (t.recurrence && t.dueDate) {
      let nextDue = addInterval(t.dueDate, t.recurrence);
      while (nextDue <= today) nextDue = addInterval(nextDue, t.recurrence);
      const alreadySpawned = next.some(
        (x) => x.id !== id && !x.done && x.recurrence && x.title === t.title && x.dueDate === nextDue
      );
      if (!alreadySpawned) {
        addTask({
          title: t.title,
          category: t.category,
          property: t.property,
          priority: t.priority,
          assignee: t.assignee,
          cost: t.cost,
          notes: t.notes,
          recurrence: t.recurrence,
          dueDate: nextDue,
        });
      }
    }
  };

  const deleteTask = (id) => {
    persist(tasksRef.current.filter((t) => t.id !== id));
    deleteTaskRow(id).then(markSynced).catch(markOffline);
  };

  const importMerge = (imported) => {
    persist(rolloverTasks(mergeTasks(tasksRef.current, imported)));
    upsertTaskRows(imported).then(markSynced).catch(markOffline);
  };

  return { tasks, addTask, updateTask, toggleDone, deleteTask, importMerge, syncState };
}
