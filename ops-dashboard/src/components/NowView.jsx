import { useState } from 'react';
import { isOverdue, localToday } from '../dates.js';
import { byPriority } from '../sorting.js';
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
            variant="bar"
            size="lg"
            openDir={openSwipe?.id === t.id ? openSwipe.dir : 0}
            onOpenChange={(dir) => setOpenSwipe(dir ? { id: t.id, dir } : null)}
          />
        ))}
      </div>
    </section>
  );
}

// Only what needs action right now: overdue, then due today. Everything
// else (upcoming, someday, done) lives in the Tasks tab.
export default function NowView({ tasks, onToggle, onEdit, onSnooze }) {
  const [openSwipe, setOpenSwipe] = useState(null);
  const today = localToday();
  const open = tasks.filter((t) => !t.done && !t.inbox);

  const overdue = open.filter(isOverdue).sort(byPriority);
  const overdueIds = new Set(overdue.map((t) => t.id));
  const dueToday = open.filter((t) => t.dueDate === today && !overdueIds.has(t.id)).sort(byPriority);

  const empty = !overdue.length && !dueToday.length;

  return (
    <div className="now-view">
      {empty ? (
        <div className="empty">
          <p>Nothing urgent — nice.</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
