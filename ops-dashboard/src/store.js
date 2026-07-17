// Data layer for ops-dashboard tasks.
// Every component talks to THIS file, never to localStorage directly —
// same pattern as maintenance-tracker's store.js. Moving to a hosted DB
// later means swapping these function bodies only.

import { localToday } from './dates.js';

const KEY = 'ops-tasks-v1';
const SNAP_PREFIX = 'ops-snapshot-';
const SPEND_KEY = 'ops-personal-spend-v1';
const SPEND_SNAP_PREFIX = 'ops-spend-snapshot-';
const SNAPS_TO_KEEP = 3;

export const CATEGORIES = ['maintenance', 'housekeeping', 'ops', 'personal'];
export const PROPERTIES = ['MRP', 'LB', 'Kove'];
export const PRIORITIES = ['high', 'med', 'low'];
export const SPEND_CATEGORIES = ['Groceries', 'Transport', 'Bills', 'Dining', 'Shopping', 'Other'];

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
    notes: null,
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
    notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim() : null,
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
    snapshot(SNAP_PREFIX, tasks);
    return true;
  } catch (e) {
    console.error('Failed to save tasks', e);
    return false;
  }
}

// Rolling daily snapshots inside localStorage — survives an accidental
// bulk-delete or a bad import, though NOT a full browser-data wipe.
// For that, use the JSON backup download.
function snapshot(prefix, data) {
  try {
    localStorage.setItem(prefix + localToday(), JSON.stringify(data));
    const snapKeys = Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .sort();
    while (snapKeys.length > SNAPS_TO_KEEP) {
      localStorage.removeItem(snapKeys.shift());
    }
  } catch (e) {
    /* snapshots are best-effort */
  }
}

/* ---------- personal spend entries (not tied to a task) ---------- */

export function newSpend(data) {
  return {
    id: makeId(),
    amount: 0,
    description: '',
    category: null,
    date: localToday(),
    createdAt: localToday(),
    ...data,
  };
}

// Coerce anything (old versions, hand-edited backups) into a valid entry.
export function normalizeSpend(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  const amount = Number(raw.amount);
  if (!description || !Number.isFinite(amount) || amount <= 0) return null;
  const dateRe = /^\d{4}-\d{2}-\d{2}/;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
    amount,
    description,
    category: typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : null,
    date: dateRe.test(raw.date) ? raw.date.slice(0, 10) : localToday(),
    createdAt: dateRe.test(raw.createdAt) ? raw.createdAt : localToday(),
  };
}

export function getPersonalSpend() {
  try {
    const raw = localStorage.getItem(SPEND_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return (Array.isArray(list) ? list : []).map(normalizeSpend).filter(Boolean);
  } catch (e) {
    console.error('Failed to read personal spend', e);
    return [];
  }
}

export function savePersonalSpend(entries) {
  try {
    localStorage.setItem(SPEND_KEY, JSON.stringify(entries));
    snapshot(SPEND_SNAP_PREFIX, entries);
    return true;
  } catch (e) {
    console.error('Failed to save personal spend', e);
    return false;
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

export function downloadBackup(tasks, personalSpend) {
  const payload = {
    app: 'ops-dashboard',
    version: 1,
    exported: new Date().toISOString(),
    tasks,
    personalSpend,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ops-backup-${localToday()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Reads a backup file. Returns { tasks, personalSpend, count, skipped }
// or throws with a friendly message. `count` covers both lists combined
// so the import confirmation can show one number; `skipped` is how many
// entries failed validation (empty title, non-positive amount, etc.)
// and were silently dropped, so the confirmation can surface that too.
export function parseBackupFile(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const taskList = Array.isArray(data) ? data : data.tasks;
  const spendList = Array.isArray(data) ? [] : data.personalSpend;
  const rawTaskCount = Array.isArray(taskList) ? taskList.length : 0;
  const rawSpendCount = Array.isArray(spendList) ? spendList.length : 0;
  const tasks = Array.isArray(taskList) ? taskList.map(normalizeTask).filter(Boolean) : [];
  const personalSpend = Array.isArray(spendList) ? spendList.map(normalizeSpend).filter(Boolean) : [];
  if (!tasks.length && !personalSpend.length) {
    throw new Error('That file does not look like an ops-dashboard backup.');
  }
  const skipped = rawTaskCount - tasks.length + (rawSpendCount - personalSpend.length);
  return { tasks, personalSpend, count: tasks.length + personalSpend.length, skipped };
}

// Merge imported items with current ones by id — imported wins on a
// clash, so exporting on the phone and importing on the laptop never
// loses items that only exist on the laptop.
function mergeById(current, imported) {
  const map = new Map(current.map((t) => [t.id, t]));
  for (const t of imported) map.set(t.id, t);
  return [...map.values()];
}

export const mergeTasks = mergeById;
export const mergePersonalSpend = mergeById;

export const formatRand = (n) => {
  const [whole, frac] = (Number(n) || 0).toFixed(2).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `R ${withCommas}.${frac}`;
};

// Parses a currency amount typed by hand, accepting a comma as the
// decimal separator (common in South African / European input) in
// addition to the standard dot. "12,50" -> 12.5; "1,234.56" is treated
// as thousands-separated ("," stripped) since it already has a dot.
export function parseAmount(input) {
  if (typeof input !== 'string') return NaN;
  const s = input.trim();
  if (!s) return NaN;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  const normalized = hasComma && hasDot ? s.replace(/,/g, '') : hasComma ? s.replace(',', '.') : s;
  return parseFloat(normalized);
}
