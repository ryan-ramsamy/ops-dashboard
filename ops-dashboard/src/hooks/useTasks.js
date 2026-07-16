import { useEffect, useState } from 'react';
import { getTasks, saveTasks, rolloverTasks, newTask, mergeTasks } from '../store.js';
import { localToday } from '../dates.js';

export function useTasks() {
  const [tasks, setTasks] = useState(() => rolloverTasks(getTasks()));

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Re-run rollover when the app comes back to the foreground or the
  // date flips while it stays open. rolloverTasks returns the same
  // reference when nothing changed, so this never causes idle rerenders.
  useEffect(() => {
    const check = () => setTasks((ts) => rolloverTasks(ts));
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(check, 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  const addTask = (data) => setTasks((ts) => [...ts, newTask(data)]);

  const updateTask = (id, patch) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const toggleDone = (id) =>
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: t.done ? null : localToday() }
          : t
      )
    );

  const deleteTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const importMerge = (imported) =>
    setTasks((ts) => rolloverTasks(mergeTasks(ts, imported)));

  return { tasks, addTask, updateTask, toggleDone, deleteTask, importMerge };
}
