import { useState } from 'react';
import { PROPERTIES, formatRand } from '../store.js';
import { localToday, addMonths, monthKeyOf, formatMonthYear, formatDayShort } from '../dates.js';

// Month a cost belongs to: the task's due date, else when it was
// completed, else when it was created.
function costMonth(t) {
  return monthKeyOf(t.dueDate || t.completedAt || t.createdAt);
}

function costDate(t) {
  return t.dueDate || t.completedAt || t.createdAt;
}

export default function SpendView({ tasks }) {
  const [month, setMonth] = useState(monthKeyOf(localToday()));

  const costed = tasks.filter((t) => t.category === 'maintenance' && Number(t.cost) > 0);
  const scoped = costed.filter((t) => costMonth(t) === month);
  const total = scoped.reduce((sum, t) => sum + Number(t.cost), 0);

  const perProperty = {};
  for (const p of PROPERTIES) perProperty[p] = 0;
  let untagged = 0;
  for (const t of scoped) {
    if (t.property) perProperty[t.property] += Number(t.cost);
    else untagged += Number(t.cost);
  }

  const items = [...scoped].sort((a, b) => (costDate(a) < costDate(b) ? 1 : -1));

  return (
    <div className="spend-view">
      <div className="card spend-card">
        <div className="cal-nav">
          <button className="icon-btn" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 6l-6 6 6 6" />
            </svg>
          </button>
          <span className="cal-label">{formatMonthYear(month)}</span>
          <button className="icon-btn" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="spend-total">
          <span className="spend-total-label">Maintenance spend</span>
          <span className="spend-total-value">{formatRand(total)}</span>
        </div>

        <div className="spend-breakdown">
          {PROPERTIES.map((p) => (
            <div key={p} className="spend-row">
              <span className="property-tag">{p}</span>
              <span className="spend-amount">{formatRand(perProperty[p])}</span>
            </div>
          ))}
          {untagged > 0 && (
            <div className="spend-row">
              <span className="property-tag">Untagged</span>
              <span className="spend-amount">{formatRand(untagged)}</span>
            </div>
          )}
        </div>
      </div>

      <section className="group">
        <h2 className="group-label">Items</h2>
        {items.length ? (
          <div className="card">
            {items.map((t) => (
              <div className="spend-item" key={t.id}>
                <div className="spend-item-main">
                  <span className="task-title">{t.title}</span>
                  <span className="task-sub">
                    {[t.property, formatDayShort(costDate(t)), t.done ? 'Done' : 'Open']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <span className="spend-amount">{formatRand(t.cost)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>No maintenance costs this month.</p>
            <p className="empty-hint">Add a cost when creating a maintenance task.</p>
          </div>
        )}
      </section>
    </div>
  );
}
