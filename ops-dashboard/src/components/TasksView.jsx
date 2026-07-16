import { useState } from 'react';
import { CATEGORIES, sentenceCase } from '../store.js';
import { localToday } from '../dates.js';
import TaskRow from './TaskRow.jsx';

const PRIORITY_RANK = { high: 0, med: 1, low: 2 };

// Open tasks first, then by priority, then title.
function byPriority(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  }
  return a.title.localeCompare(b.title);
}

function byDateThenPriority(a, b) {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  return byPriority(a, b);
}

function Group({ label, tasks, onToggle, onEdit, showDate = false }) {
  if (!tasks.length) return null;
  return (
    <section className="group">
      <h2 className="group-label">{label}</h2>
      <div className="card">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} showDate={showDate} />
        ))}
      </div>
    </section>
  );
}

export default function TasksView({ tasks, onToggle, onEdit }) {
  const [filter, setFilter] = useState('all');
  const today = localToday();

  // Completed tasks stay visible (struck through) for the rest of the day,
  // then drop off the list. They remain in the data for Spend history.
  const visible = tasks.filter((t) => !t.done || t.completedAt === today);
  const filtered = filter === 'all' ? visible : visible.filter((t) => t.category === filter);

  const dueToday = filtered.filter((t) => t.dueDate && t.dueDate <= today).sort(byPriority);
  const upcoming = filtered
    .filter((t) => t.dueDate && t.dueDate > today)
    .sort(byDateThenPriority);
  const someday = filtered.filter((t) => !t.dueDate).sort(byPriority);

  const empty = !dueToday.length && !upcoming.length && !someday.length;

  return (
    <div className="tasks-view">
      <div className="chips" role="tablist">
        {['all', ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={`chip ${filter === c ? 'selected' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c === 'all' ? 'All' : sentenceCase(c)}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="empty">
          <p>No tasks{filter === 'all' ? ' yet' : ' in this category'}.</p>
          <p className="empty-hint">Tap + to add one.</p>
        </div>
      ) : (
        <>
          <Group label="Due today" tasks={dueToday} onToggle={onToggle} onEdit={onEdit} />
          <Group label="Upcoming" tasks={upcoming} onToggle={onToggle} onEdit={onEdit} showDate />
          <Group label="Someday" tasks={someday} onToggle={onToggle} onEdit={onEdit} />
        </>
      )}
    </div>
  );
}
