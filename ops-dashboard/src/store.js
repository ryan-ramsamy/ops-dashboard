// Data layer for ops-dashboard tasks.
// Every component talks to THIS file, never to localStorage directly —
// same pattern as maintenance-tracker's store.js. Moving to a hosted DB
// later means swapping these function bodies only.

import { localToday } from './dates.js';

const KEY = 'ops-tasks-v1';
const SNAP_PREFIX = 'ops-snapshot-';
const SNAPS_TO_KEEP = 3;

export const CATEGORIES = ['maintenance', 'housekeeping', 'ops', 'personal'];
export const PROPERTIES = ['MRP', 'LB', 'Kove'];
export const PRIORITIES = ['high', 'med', 'low'];

export const sentenceCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function makeId() {
  return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

export function newTask(data) {
  return {
    id: makeId(),
    title: '',
    category: 'ops',
    property: null,
    priority: 'med',
    dueDate: null, // 'YYYY-MM-DD' or null = someday
    assignee: null,
    cost: null, // rand amount; only meaningful on maintenance tasks
    done: false,
    createdAt: localToday(),
    completedAt: null,
    ...data,
  };
}

// Coerce anything (old versions, hand-edited backups) into a valid task.
export function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  const dateRe = /^\d{4}-\d{2}-\d{2}/;
  const cost = Number(raw.cost);
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
    title,
    category: CATEGORIES.includes(raw.category) ? raw.category : 'ops',
    property: PROPERTIES.includes(raw.property) ? raw.property : null,
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'med',
    dueDate: dateRe.test(raw.dueDate) ? raw.dueDate.slice(0, 10) : null,
    assignee: typeof raw.assignee === 'string' && raw.assignee.trim() ? raw.assignee.trim() : null,
    cost: Number.isFinite(cost) && cost > 0 ? cost : null,
    done: !!raw.done,
    createdAt: dateRe.test(raw.createdAt) ? raw.createdAt : localToday(),
    completedAt: dateRe.test(raw.completedAt) ? raw.completedAt.slice(0, 10) : null,
  };
}

export function getTasks() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return (Array.isArray(list) ? list : []).map(normalizeTask).filter(Boolean);
  } catch (e) {
    console.error('Failed to read tasks', e);
    return [];
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
    snapshot(tasks);
    return true;
  } catch (e) {
    console.error('Failed to save tasks', e);
    return false;
  }
}

// Rolling daily snapshots inside localStorage — survives an accidental
// bulk-delete or a bad import, though NOT a full browser-data wipe.
// For that, use the JSON backup download.
function snapshot(tasks) {
  try {
    localStorage.setItem(SNAP_PREFIX + localToday(), JSON.stringify(tasks));
    const snapKeys = Object.keys(localStorage)
      .filter((k) => k.startsWith(SNAP_PREFIX))
      .sort();
    while (snapKeys.length > SNAPS_TO_KEEP) {
      localStorage.removeItem(snapKeys.shift());
    }
  } catch (e) {
    /* snapshots are best-effort */
  }
}

// Tweek-style rollover: an unfinished dated task whose date has passed
// moves to today. Returns the same array reference when nothing changed.
export function rolloverTasks(tasks, today = localToday()) {
  let changed = false;
  const next = tasks.map((t) => {
    if (!t.done && t.dueDate && t.dueDate < today) {
      changed = true;
      return { ...t, dueDate: today };
    }
    return t;
  });
  return changed ? next : tasks;
}

/* ---------- JSON backup & restore (mirrors maintenance-tracker) ---------- */

export function downloadBackup(tasks) {
  const payload = {
    app: 'ops-dashboard',
    version: 1,
    exported: new Date().toISOString(),
    tasks,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ops-backup-${localToday()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Reads a backup file. Returns { tasks, count } or throws with a friendly message.
export function parseBackupFile(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const list = Array.isArray(data) ? data : data.tasks;
  if (!Array.isArray(list)) throw new Error('No tasks found in that file.');
  const tasks = list.map(normalizeTask).filter(Boolean);
  if (!tasks.length) throw new Error('That file does not look like an ops-dashboard backup.');
  return { tasks, count: tasks.length };
}

// Merge imported tasks with current ones — imported wins on ID clash,
// so exporting on the phone and importing on the laptop never loses
// tasks that only exist on the laptop.
export function mergeTasks(current, imported) {
  const map = new Map(current.map((t) => [t.id, t]));
  for (const t of imported) map.set(t.id, t);
  return [...map.values()];
}

export const formatRand = (n) => {
  const [whole, frac] = (Number(n) || 0).toFixed(2).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `R ${withCommas}.${frac}`;
};
