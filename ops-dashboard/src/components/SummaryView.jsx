import { localToday, addDays, formatDayLong } from '../dates.js';

// Read-only digest across every section — no editing here, just buckets
// to glance at. Mirrors the same date logic TasksView/TaskRow use so the
// counts always agree with what those views show.
function bucketTasks(tasks) {
  const today = localToday();
  const weekEnd = addDays(today, 7);
  const open = tasks.filter((t) => !t.done && !t.inbox);

  const overdue = open.filter(
    (t) => t.originalDueDate && t.dueDate && t.originalDueDate < t.dueDate
  );
  const overdueIds = new Set(overdue.map((t) => t.id));

  const dueToday = open.filter((t) => t.dueDate === today && !overdueIds.has(t.id));
  const dueThisWeek = open.filter((t) => t.dueDate && t.dueDate > today && t.dueDate <= weekEnd);
  const someday = open.filter((t) => !t.dueDate);

  return { overdue, dueToday, dueThisWeek, someday };
}

function Row({ label, count, tone }) {
  return (
    <div className="summary-row">
      <span className="summary-row-label">{label}</span>
      <span className={`summary-row-count${tone ? ` summary-row-count-${tone}` : ''}`}>{count}</span>
    </div>
  );
}

export default function SummaryView({ tasks, inboxCount }) {
  const { overdue, dueToday, dueThisWeek, someday } = bucketTasks(tasks);

  return (
    <div className="summary-view">
      <section className="group">
        <h2 className="group-label">Across all sections</h2>
        <div className="card">
          <Row label="Overdue" count={overdue.length} tone={overdue.length ? 'red' : undefined} />
          <Row label="Due today" count={dueToday.length} />
          <Row label="Due this week" count={dueThisWeek.length} />
          <Row label="Someday" count={someday.length} />
        </div>
      </section>

      <section className="group">
        <h2 className="group-label">Inbox</h2>
        <div className="card">
          <Row label="Unsorted" count={inboxCount} tone={inboxCount ? 'amber' : undefined} />
        </div>
      </section>

      <p className="summary-hint">{formatDayLong(localToday())}</p>
    </div>
  );
}
