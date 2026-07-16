import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, sentenceCase } from '../store.js';
import { localToday } from '../dates.js';
import SwipeableTaskRow from './SwipeableTaskRow.jsx';

const UNDO_MS = 3500;
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

function Group({ label, tasks, onToggle, onEdit, onDeleteRequest, showDate, openSwipeId, setOpenSwipeId }) {
  if (!tasks.length) return null;
  return (
    <section className="group">
      <h2 className="group-label">{label}</h2>
      <div className="card">
        {tasks.map((t) => (
          <SwipeableTaskRow
            key={t.id}
            task={t}
            onToggle={onToggle}
            onEdit={onEdit}
            onDeleteRequest={onDeleteRequest}
            showDate={showDate}
            isOpen={openSwipeId === t.id}
            onOpenChange={(open) => setOpenSwipeId(open ? t.id : null)}
          />
        ))}
      </div>
    </section>
  );
}

function DoneGroup({ tasks, onToggle, onEdit, onDeleteRequest, openSwipeId, setOpenSwipeId }) {
  const [expanded, setExpanded] = useState(false);
  if (!tasks.length) return null;
  return (
    <section className="group">
      <button
        className="group-label done-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
      >
        <span>
          Done <span className="done-count">({tasks.length})</span>
        </span>
        <span className={`done-caret ${expanded ? 'open' : ''}`}>▸</span>
      </button>
      {expanded && (
        <div className="card">
          {tasks.map((t) => (
            <SwipeableTaskRow
              key={t.id}
              task={t}
              onToggle={onToggle}
              onEdit={onEdit}
              onDeleteRequest={onDeleteRequest}
              isOpen={openSwipeId === t.id}
              onOpenChange={(open) => setOpenSwipeId(open ? t.id : null)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TasksView({ tasks, onToggle, onEdit, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [openSwipeId, setOpenSwipeId] = useState(null);
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [toast, setToast] = useState(null); // { id, title } | null
  const timeoutRef = useRef(null);
  const today = localToday();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const finalizeDelete = (id) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    onDelete(id);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setToast(null);
  };

  const requestDelete = (task) => {
    // Only one undo toast at a time — finalize whatever was pending.
    if (toast) finalizeDelete(toast.id);
    setHiddenIds((prev) => new Set(prev).add(task.id));
    setToast({ id: task.id, title: task.title });
    timeoutRef.current = setTimeout(() => finalizeDelete(task.id), UNDO_MS);
  };

  const undoDelete = () => {
    if (!toast) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    const id = toast.id;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setToast(null);
  };

  const notHidden = tasks.filter((t) => !hiddenIds.has(t.id));
  const filtered = filter === 'all' ? notHidden : notHidden.filter((t) => t.category === filter);

  // Completed tasks stay eligible (for the "Done" section) for the rest
  // of the day, then drop off the list entirely. They remain in the
  // data for Spend history regardless.
  const eligible = filtered.filter((t) => !t.done || t.completedAt === today);
  const openTasks = eligible.filter((t) => !t.done);
  const doneTasks = eligible.filter((t) => t.done).sort(byPriority);

  const dueToday = openTasks.filter((t) => t.dueDate && t.dueDate <= today).sort(byPriority);
  const upcoming = openTasks
    .filter((t) => t.dueDate && t.dueDate > today)
    .sort(byDateThenPriority);
  const someday = openTasks.filter((t) => !t.dueDate).sort(byPriority);

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

      {empty && !doneTasks.length ? (
        <div className="empty">
          <p>No tasks{filter === 'all' ? ' yet' : ' in this category'}.</p>
          <p className="empty-hint">Tap + to add one.</p>
        </div>
      ) : (
        <>
          {empty && (
            <div className="empty">
              <p>No open tasks{filter === 'all' ? '' : ' in this category'}.</p>
              <p className="empty-hint">Tap + to add one.</p>
            </div>
          )}
          <Group
            label="Due today"
            tasks={dueToday}
            onToggle={onToggle}
            onEdit={onEdit}
            onDeleteRequest={requestDelete}
            openSwipeId={openSwipeId}
            setOpenSwipeId={setOpenSwipeId}
          />
          <Group
            label="Upcoming"
            tasks={upcoming}
            onToggle={onToggle}
            onEdit={onEdit}
            onDeleteRequest={requestDelete}
            showDate
            openSwipeId={openSwipeId}
            setOpenSwipeId={setOpenSwipeId}
          />
          <Group
            label="Someday"
            tasks={someday}
            onToggle={onToggle}
            onEdit={onEdit}
            onDeleteRequest={requestDelete}
            openSwipeId={openSwipeId}
            setOpenSwipeId={setOpenSwipeId}
          />
        </>
      )}

      <DoneGroup
        tasks={doneTasks}
        onToggle={onToggle}
        onEdit={onEdit}
        onDeleteRequest={requestDelete}
        openSwipeId={openSwipeId}
        setOpenSwipeId={setOpenSwipeId}
      />

      {toast && (
        <div className="undo-toast">
          <span className="undo-toast-text">Deleted “{toast.title}”</span>
          <button className="undo-toast-action" onClick={undoDelete}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
