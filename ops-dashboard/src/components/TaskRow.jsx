import { sentenceCase, formatRand, propertySlug } from '../store.js';
import { isOverdue, formatDueLabel } from '../dates.js';

// variant: 'dot' (small category dot next to the title, used in dense
// lists) or 'bar' (4px category-colored left edge on the whole card,
// used in the Now view where cards are already larger/sparser).
// size: 'md' (standard) or 'lg' (Now view — bigger, bolder title).
export default function TaskRow({ task, onToggle, onEdit, variant = 'dot', size = 'md' }) {
  const sub = [task.assignee, task.cost != null ? formatRand(task.cost) : null].filter(Boolean).join(' · ');
  const overdue = isOverdue(task);

  const classes = [
    'task-card',
    `size-${size}`,
    task.done && 'is-done',
    overdue && 'is-overdue',
    variant === 'bar' && `accent-bar cat-${task.category}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
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
      <button className="task-card-main" onClick={() => onEdit(task)}>
        <div className="task-card-top">
          {variant === 'dot' && <span className={`cat-dot cat-${task.category}`} aria-hidden="true" />}
          <span className="task-title">{task.title}</span>
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
        </div>
        {(task.property || sub) && (
          <div className="task-card-sub">
            {task.property && (
              <span className={`prop-tag prop-${propertySlug(task.property)}`}>{task.property}</span>
            )}
            {sub && <span className="task-assignee">{sub}</span>}
          </div>
        )}
      </button>
      <div className="task-card-meta">
        <span className={`pill pill-${task.priority}`}>{sentenceCase(task.priority)}</span>
        <span className={`due-label ${overdue ? 'is-overdue' : ''}`}>{formatDueLabel(task)}</span>
      </div>
    </div>
  );
}
