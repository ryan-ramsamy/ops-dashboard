import { useEffect, useState } from 'react';
import { getTasks, saveTasks, rolloverTasks, newTask, mergeTasks } from '../store.js';
import { localToday, addInterval } from '../dates.js';

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

  // Completing a recurring task spawns its next occurrence with the same
  // details, dated one interval on (from the current due date, which
  // rollover has already pulled to today if it was overdue). Un-completing
  // does NOT retract an already-spawned occurrence — but re-completing
  // won't spawn a duplicate either, thanks to the same-title/same-date guard.
  const toggleDone = (id) =>
    setTasks((ts) => {
      const t = ts.find((x) => x.id === id);
      if (!t) return ts;
      if (t.done) {
        return ts.map((x) => (x.id === id ? { ...x, done: false, completedAt: null } : x));
      }
      const next = ts.map((x) =>
        x.id === id ? { ...x, done: true, completedAt: localToday() } : x
      );
      if (t.recurrence && t.dueDate) {
        const today = localToday();
        let nextDue = addInterval(t.dueDate, t.recurrence);
        while (nextDue <= today) nextDue = addInterval(nextDue, t.recurrence);
        const alreadySpawned = ts.some(
          (x) => x.id !== id && !x.done && x.recurrence && x.title === t.title && x.dueDate === nextDue
        );
        if (!alreadySpawned) {
          next.push(
            newTask({
              title: t.title,
              category: t.category,
              property: t.property,
              priority: t.priority,
              assignee: t.assignee,
              cost: t.cost,
              notes: t.notes,
              recurrence: t.recurrence,
              dueDate: nextDue,
            })
          );
        }
      }
      return next;
    });

  const deleteTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const importMerge = (imported) =>
    setTasks((ts) => rolloverTasks(mergeTasks(ts, imported)));

  return { tasks, addTask, updateTask, toggleDone, deleteTask, importMerge };
}
