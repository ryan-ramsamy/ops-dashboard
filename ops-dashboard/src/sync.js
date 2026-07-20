// Supabase persistence + the localStorage offline cache in front of it.
// Every component still talks to the data layer through the hooks
// (useTasks/useSpend), which call the functions here — this file is the
// only thing that knows about Supabase or localStorage.
//
// Pattern: cache-first render (readTasksCache/readSpendCache, instant,
// no network), then reconcile with Supabase in the background
// (fetchTasks/fetchPersonalSpend) on load and on tab focus. Mutations are
// optimistic — write through to the cache immediately, push to Supabase
// after, and just log+flag if that push fails (see hooks/useTasks.js).

import { supabase } from './supabaseClient.js';
import { normalizeTask, normalizeSpend } from './store.js';

const TASKS_CACHE_KEY = 'ops-tasks-cache-v1';
const SPEND_CACHE_KEY = 'ops-personal-spend-cache-v1';

// Pre-Supabase localStorage keys — read once (readLegacyLocalData) to
// offer the one-time upload prompt, then never written to again.
const LEGACY_TASKS_KEY = 'ops-tasks-v1';
const LEGACY_SPEND_KEY = 'ops-personal-spend-v1';
export const MIGRATION_FLAG_KEY = 'ops-migrated-to-supabase-v1';

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* cache is best-effort — a full/blocked localStorage shouldn't crash the app */
  }
}

export function readTasksCache() {
  return readCache(TASKS_CACHE_KEY).map(normalizeTask).filter(Boolean);
}

export function writeTasksCache(tasks) {
  writeCache(TASKS_CACHE_KEY, tasks);
}

export function readSpendCache() {
  return readCache(SPEND_CACHE_KEY).map(normalizeSpend).filter(Boolean);
}

export function writeSpendCache(entries) {
  writeCache(SPEND_CACHE_KEY, entries);
}

export function readLegacyLocalData() {
  return {
    tasks: readCache(LEGACY_TASKS_KEY).map(normalizeTask).filter(Boolean),
    personalSpend: readCache(LEGACY_SPEND_KEY).map(normalizeSpend).filter(Boolean),
  };
}

/* ---------- row <-> JS shape mapping (camelCase <-> snake_case) ---------- */

function taskToRow(task) {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    property: task.property,
    priority: task.priority,
    due_date: task.dueDate,
    assignee: task.assignee,
    cost: task.cost,
    notes: task.notes,
    recurrence: task.recurrence,
    original_due_date: task.originalDueDate,
    inbox: task.inbox,
    done: task.done,
    created_at: task.createdAt,
    completed_at: task.completedAt,
  };
}

function rowToTask(row) {
  return normalizeTask({
    id: row.id,
    title: row.title,
    category: row.category,
    property: row.property,
    priority: row.priority,
    dueDate: row.due_date,
    assignee: row.assignee,
    cost: row.cost,
    notes: row.notes,
    recurrence: row.recurrence,
    originalDueDate: row.original_due_date,
    inbox: row.inbox,
    done: row.done,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  });
}

const TASK_PATCH_KEY_MAP = {
  dueDate: 'due_date',
  originalDueDate: 'original_due_date',
  createdAt: 'created_at',
  completedAt: 'completed_at',
};

function taskPatchToRow(patch) {
  const row = {};
  for (const [k, v] of Object.entries(patch)) row[TASK_PATCH_KEY_MAP[k] || k] = v;
  return row;
}

function spendToRow(entry) {
  return {
    id: entry.id,
    amount: entry.amount,
    description: entry.description,
    category: entry.category,
    date: entry.date,
    created_at: entry.createdAt,
  };
}

function rowToSpend(row) {
  return normalizeSpend({
    id: row.id,
    amount: row.amount,
    description: row.description,
    category: row.category,
    date: row.date,
    createdAt: row.created_at,
  });
}

const SPEND_PATCH_KEY_MAP = { createdAt: 'created_at' };

function spendPatchToRow(patch) {
  const row = {};
  for (const [k, v] of Object.entries(patch)) row[SPEND_PATCH_KEY_MAP[k] || k] = v;
  return row;
}

/* ---------- tasks ---------- */

export async function fetchTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(rowToTask);
}

export async function insertTaskRow(task) {
  const { error } = await supabase.from('tasks').insert(taskToRow(task));
  if (error) throw error;
}

export async function updateTaskRow(id, patch) {
  const { error } = await supabase.from('tasks').update(taskPatchToRow(patch)).eq('id', id);
  if (error) throw error;
}

export async function deleteTaskRow(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertTaskRows(tasks) {
  if (!tasks.length) return;
  const { error } = await supabase.from('tasks').upsert(tasks.map(taskToRow));
  if (error) throw error;
}

/* ---------- personal spend ---------- */

export async function fetchPersonalSpend() {
  const { data, error } = await supabase.from('personal_spend').select('*').order('date', { ascending: true });
  if (error) throw error;
  return data.map(rowToSpend);
}

export async function insertSpendRow(entry) {
  const { error } = await supabase.from('personal_spend').insert(spendToRow(entry));
  if (error) throw error;
}

export async function updateSpendRow(id, patch) {
  const { error } = await supabase.from('personal_spend').update(spendPatchToRow(patch)).eq('id', id);
  if (error) throw error;
}

export async function deleteSpendRow(id) {
  const { error } = await supabase.from('personal_spend').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertSpendRows(entries) {
  if (!entries.length) return;
  const { error } = await supabase.from('personal_spend').upsert(entries.map(spendToRow));
  if (error) throw error;
}
