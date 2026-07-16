import { sentenceCase, formatRand } from '../store.js';
import { formatDayShort } from '../dates.js';

export default function TaskRow({ task, onToggle, onEdit, showDate = false }) {
  const sub = [
    task.property,
    task.assignee,
    task.cost != null ? formatRand(task.cost) : null,
  ]
    .filter(Boolean)
    .join(' · ');

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
        {showDate && task.dueDate && (
          <span className="task-date">{formatDayShort(task.dueDate)}</span>
        )}
        <span className={`badge badge-${task.priority}`}>{sentenceCase(task.priority)}</span>
      </div>
    </div>
  );
}
