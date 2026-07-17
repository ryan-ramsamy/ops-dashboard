import { sentenceCase, formatRand } from '../store.js';
import { formatDayShort, daysBetween } from '../dates.js';

export default function TaskRow({ task, onToggle, onEdit, showDate = false }) {
  const sub = [
    task.property,
    task.assignee,
    task.cost != null ? formatRand(task.cost) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Rollover moved this task here from an earlier date — surface how
  // late it is instead of letting it blend in with today's tasks.
  const overdueDays =
    !task.done && task.originalDueDate && task.dueDate && task.originalDueDate < task.dueDate
      ? daysBetween(task.originalDueDate, task.dueDate)
      : 0;

  return (
    <div className={`task-row ${task.done ? 'is-done' : ''}`}>
      <button
        className={`check ${task.done ? 'checked' : ''}`}
        aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
        onClick={() => onToggle(task.id)}
      >
        {task.done && (
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6.2l2.3 2.3 4.7-5" />
          </svg>
        )}
      </button>
      <button className="task-body" onClick={() => onEdit(task)}>
        <span className="task-title">{task.title}</span>
        {sub && <span className="task-sub">{sub}</span>}
      </button>
      <div className="task-meta">
        {task.recurrence && (
          <span className="note-indicator" role="img" aria-label="Repeats" title="Repeats">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2.5l4 4-4 4" />
              <path d="M3 11.5v-1a4 4 0 014-4h14" />
              <path d="M7 21.5l-4-4 4-4" />
              <path d="M21 13.5v1a4 4 0 01-4 4H3" />
            </svg>
          </span>
        )}
        {task.notes && (
          <span className="note-indicator" role="img" aria-label="Has notes" title="Has notes">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3.5h9l4.5 4.5V20a1 1 0 01-1 1H6a1 1 0 01-1-1V4.5a1 1 0 011-1z" />
              <path d="M9 12h6M9 15.5h6" />
            </svg>
          </span>
        )}
        {overdueDays > 0 && (
          <span className="badge badge-overdue">{overdueDays}d overdue</span>
        )}
        {showDate && task.dueDate && (
          <span className="task-date">{formatDayShort(task.dueDate)}</span>
        )}
        <span className={`badge badge-${task.priority}`}>{sentenceCase(task.priority)}</span>
      </div>
    </div>
  );
}
