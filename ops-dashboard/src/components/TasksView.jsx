import { useState } from 'react';
import { CATEGORIES, sentenceCase } from '../store.js';
import { localToday, isOverdue } from '../dates.js';
import { byPriority, byDateThenPriority } from '../sorting.js';
import SwipeableTaskRow from './SwipeableTaskRow.jsx';

function Group({ label, tasks, onToggle, onEdit, onSnooze, openSwipe, setOpenSwipe }) {
  if (!tasks.length) return null;
  return (
    <section className="group">
      <h2 className="group-label">{label}</h2>
      <div className="card-list">
        {tasks.map((t) => (
          <SwipeableTaskRow
            key={t.id}
            task={t}
            onToggle={onToggle}
            onEdit={onEdit}
            onSnooze={onSnooze}
            openDir={openSwipe?.id === t.id ? openSwipe.dir : 0}
            onOpenChange={(dir) => setOpenSwipe(dir ? { id: t.id, dir } : null)}
          />
        ))}
      </div>
    </section>
  );
}

function DoneGroup({ tasks, onToggle, onEdit, onSnooze, openSwipe, setOpenSwipe }) {
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
        <div className="card-list">
          {tasks.map((t) => (
            <SwipeableTaskRow
              key={t.id}
              task={t}
              onToggle={onToggle}
              onEdit={onEdit}
              onSnooze={onSnooze}
              openDir={openSwipe?.id === t.id ? openSwipe.dir : 0}
              onOpenChange={(dir) => setOpenSwipe(dir ? { id: t.id, dir } : null)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TasksView({ tasks, onToggle, onEdit, onSnooze }) {
  const [filter, setFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openSwipe, setOpenSwipe] = useState(null); // { id, dir: -1 } | null
  const today = localToday();

  // Assignee chips reflect whoever actually appears in the data — no
  // hardcoded people list. Falls back to 'all' if the filtered person's
  // last task is deleted.
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort();
  const activeAssignee = assignees.includes(assigneeFilter) ? assigneeFilter : 'all';

  // Inbox items aren't triaged into a section yet, so they stay out of
  // every Tasks view list until sorted from the Inbox.
  const notInbox = tasks.filter((t) => !t.inbox);

  // Search cuts across every category/assignee/section (title + notes);
  // the chip filters only apply when not searching.
  const q = query.trim().toLowerCase();
  const searching = searchOpen && q !== '';
  let filtered;
  if (searching) {
    filtered = notInbox.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q)
    );
  } else {
    filtered = filter === 'all' ? notInbox : notInbox.filter((t) => t.category === filter);
    if (activeAssignee !== 'all') filtered = filtered.filter((t) => t.assignee === activeAssignee);
  }

  // Completed tasks stay eligible (for the "Done" section) for the rest
  // of the day, then drop off the list entirely. They remain in the
  // data for Spend history regardless.
  const eligible = filtered.filter((t) => !t.done || t.completedAt === today);
  const openTasks = eligible.filter((t) => !t.done);
  const doneTasks = eligible.filter((t) => t.done).sort(byPriority);

  const overdue = openTasks.filter(isOverdue).sort(byPriority);
  const overdueIds = new Set(overdue.map((t) => t.id));
  const dueToday = openTasks
    .filter((t) => t.dueDate === today && !overdueIds.has(t.id))
    .sort(byPriority);
  const upcoming = openTasks
    .filter((t) => t.dueDate && t.dueDate > today)
    .sort(byDateThenPriority);
  const someday = openTasks.filter((t) => !t.dueDate).sort(byPriority);

  const empty = !overdue.length && !dueToday.length && !upcoming.length && !someday.length;

  return (
    <div className="tasks-view">
      {searchOpen ? (
        <div className="search-bar">
          <input
            className="input search-input"
            autoFocus
            placeholder="Search title and notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="icon-btn"
            aria-label="Close search"
            onClick={() => {
              setSearchOpen(false);
              setQuery('');
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="filter-bar">
            <div className="chips">
              {['all', ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  className={`chip ${filter === c ? 'selected' : ''}`}
                  aria-pressed={filter === c}
                  onClick={() => setFilter(c)}
                >
                  {c === 'all' ? 'All' : sentenceCase(c)}
                </button>
              ))}
            </div>
            <button className="icon-btn" aria-label="Search tasks" onClick={() => setSearchOpen(true)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5L21 21" />
              </svg>
            </button>
          </div>
          {assignees.length > 0 && (
            <div className="chips assignee-chips">
              {['all', ...assignees].map((a) => (
                <button
                  key={a}
                  className={`chip ${activeAssignee === a ? 'selected' : ''}`}
                  aria-pressed={activeAssignee === a}
                  onClick={() => setAssigneeFilter(a)}
                >
                  {a === 'all' ? 'Anyone' : a}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {empty && !doneTasks.length ? (
        searching ? (
          <div className="empty">
            <p>No tasks match “{query.trim()}”.</p>
          </div>
        ) : (
          <div className="empty">
            <p>No tasks{filter === 'all' ? ' yet' : ' in this category'}.</p>
            <p className="empty-hint">Tap the + button to add one.</p>
          </div>
        )
      ) : (
        <>
          {empty && !searching && (
            <div className="empty">
              <p>No open tasks{filter === 'all' ? '' : ' in this category'}.</p>
              <p className="empty-hint">Tap the + button to add one.</p>
            </div>
          )}
          <Group
            label="Overdue"
            tasks={overdue}
            onToggle={onToggle}
            onEdit={onEdit}
            onSnooze={onSnooze}
            openSwipe={openSwipe}
            setOpenSwipe={setOpenSwipe}
          />
          <Group
            label="Due today"
            tasks={dueToday}
            onToggle={onToggle}
            onEdit={onEdit}
            onSnooze={onSnooze}
            openSwipe={openSwipe}
            setOpenSwipe={setOpenSwipe}
          />
          <Group
            label="Upcoming"
            tasks={upcoming}
            onToggle={onToggle}
            onEdit={onEdit}
            onSnooze={onSnooze}
            openSwipe={openSwipe}
            setOpenSwipe={setOpenSwipe}
          />
          <Group
            label="Someday"
            tasks={someday}
            onToggle={onToggle}
            onEdit={onEdit}
            onSnooze={onSnooze}
            openSwipe={openSwipe}
            setOpenSwipe={setOpenSwipe}
          />
        </>
      )}

      <DoneGroup
        tasks={doneTasks}
        onToggle={onToggle}
        onEdit={onEdit}
        onSnooze={onSnooze}
        openSwipe={openSwipe}
        setOpenSwipe={setOpenSwipe}
      />
    </div>
  );
}
