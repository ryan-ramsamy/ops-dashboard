// All dates in the app are local calendar dates as 'YYYY-MM-DD' strings
// (and months as 'YYYY-MM'). String comparison equals date comparison.

export function toDateStr(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localToday() {
  return toDateStr(new Date());
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

// Rollover moved this task here from an earlier date — the single source
// of truth for "is this overdue" used by every view that buckets tasks.
export function isOverdue(task) {
  return !task.done && !!task.originalDueDate && !!task.dueDate && task.originalDueDate < task.dueDate;
}

// The due-date label shown on a task card: "Nd overdue", "Today",
// "Someday", or a short weekday+date for anything further out.
export function formatDueLabel(task) {
  if (isOverdue(task)) {
    return `${daysBetween(task.originalDueDate, task.dueDate)}d overdue`;
  }
  if (!task.dueDate) return 'Someday';
  if (task.dueDate === localToday()) return 'Today';
  return formatDayShort(task.dueDate);
}

// Advances a date by a recurrence rule ({ unit: 'day'|'week'|'month',
// interval: n }). Month steps clamp to the last day of a shorter month
// (Jan 31 + 1 month = Feb 28), matching how people expect "monthly" to
// behave for end-of-month tasks.
export function addInterval(dateStr, rule) {
  const d = parseDate(dateStr);
  if (rule.unit === 'day') {
    d.setDate(d.getDate() + rule.interval);
  } else if (rule.unit === 'week') {
    d.setDate(d.getDate() + 7 * rule.interval);
  } else {
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + rule.interval);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  }
  return toDateStr(d);
}

export function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7);
}

export function addMonths(monthKey, n) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toDateStr(d).slice(0, 7);
}

export function formatDayShort(dateStr) {
  return parseDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDayLong(dateStr) {
  return parseDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatMonthYear(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// Weeks start on Monday.
function mondayOffset(d) {
  return (d.getDay() + 6) % 7;
}

export function getWeekDays(dateStr) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() - mondayOffset(d));
  return Array.from({ length: 7 }, () => {
    const s = toDateStr(d);
    d.setDate(d.getDate() + 1);
    return s;
  });
}

// Array of weeks covering the month; each cell { date, inMonth }.
export function getMonthGrid(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const cur = new Date(y, m - 1, 1 - mondayOffset(first));
  const weeks = [];
  do {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: toDateStr(cur), inMonth: cur.getMonth() === m - 1 });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  } while (cur.getMonth() === m - 1);
  return weeks;
}
