// Shared task sort comparators — used by both TasksView (Due today /
// Upcoming / Someday / Done) and CalendarView (a selected day's list),
// so priority ordering behaves identically everywhere in the app.

export const PRIORITY_RANK = { high: 0, med: 1, low: 2 };

// Open tasks first, then by priority, then title.
export function byPriority(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  }
  return a.title.localeCompare(b.title);
}

export function byDateThenPriority(a, b) {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  return byPriority(a, b);
}
