import { useState } from 'react';
import { PROPERTIES, formatRand, propertySlug } from '../store.js';
import { localToday, addMonths, monthKeyOf, formatMonthYear, formatDayShort } from '../dates.js';
import MonthNav from './MonthNav.jsx';

// Month a maintenance cost belongs to: the task's due date, else when it
// was completed, else when it was created.
function costMonth(t) {
  return monthKeyOf(t.dueDate || t.completedAt || t.createdAt);
}

function costDate(t) {
  return t.dueDate || t.completedAt || t.createdAt;
}

// Last-3-months trend at a glance, colored to match the property's tag —
// answers "is this property trending up" without a separate chart screen.
function Sparkline({ values, colorVar }) {
  const max = Math.max(...values, 1);
  return (
    <div className="spark" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="spark-bar"
          style={{ height: `${Math.max(12, Math.round((v / max) * 100))}%`, background: `var(${colorVar})` }}
        />
      ))}
    </div>
  );
}

export default function SpendView({ tasks, personalSpend, onAddPersonal, onEditPersonal }) {
  const [month, setMonth] = useState(monthKeyOf(localToday()));

  const costed = tasks.filter((t) => t.category === 'maintenance' && Number(t.cost) > 0);
  const scopedTasks = costed.filter((t) => costMonth(t) === month);
  const maintenanceTotal = scopedTasks.reduce((sum, t) => sum + Number(t.cost), 0);

  const perProperty = {};
  for (const p of PROPERTIES) perProperty[p] = 0;
  let untagged = 0;
  for (const t of scopedTasks) {
    if (t.property) perProperty[t.property] += Number(t.cost);
    else untagged += Number(t.cost);
  }

  const trendMonths = [addMonths(month, -2), addMonths(month, -1), month];
  const propertyTrend = (p) =>
    trendMonths.map((m) => costed.filter((t) => t.property === p && costMonth(t) === m).reduce((s, t) => s + Number(t.cost), 0));

  const maintenanceItems = [...scopedTasks].sort((a, b) => (costDate(a) < costDate(b) ? 1 : -1));

  const scopedSpend = personalSpend.filter((e) => monthKeyOf(e.date) === month);
  const personalTotal = scopedSpend.reduce((sum, e) => sum + Number(e.amount), 0);

  const perCategory = new Map();
  for (const e of scopedSpend) {
    const key = e.category || 'Other';
    perCategory.set(key, (perCategory.get(key) || 0) + Number(e.amount));
  }
  const categoryRows = [...perCategory.entries()].sort((a, b) => b[1] - a[1]);

  const personalItems = [...scopedSpend].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="spend-view">
      <MonthNav
        label={formatMonthYear(month)}
        onPrev={() => setMonth(addMonths(month, -1))}
        onNext={() => setMonth(addMonths(month, 1))}
        prevLabel="Previous month"
        nextLabel="Next month"
        standalone
      />

      <div className="card spend-card">
        <div className="spend-total">
          <span className="spend-total-label">Maintenance spend</span>
          <span className="spend-total-value">{formatRand(maintenanceTotal)}</span>
        </div>

        <div className="spend-breakdown">
          {PROPERTIES.map((p) => (
            <div key={p} className="spend-row">
              <span className={`property-tag prop-${propertySlug(p)}`}>{p}</span>
              <Sparkline values={propertyTrend(p)} colorVar={`--prop-${propertySlug(p)}-ink`} />
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
        <h2 className="group-label">Maintenance items</h2>
        {maintenanceItems.length ? (
          <div className="card">
            {maintenanceItems.map((t) => (
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

      <div className="card spend-card">
        <div className="spend-card-header">
          <span className="spend-total-label">Personal spend</span>
          <button className="icon-btn" aria-label="Add personal spend" onClick={onAddPersonal}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div className="spend-total spend-total-tight">
          <span className="spend-total-value">{formatRand(personalTotal)}</span>
        </div>

        {categoryRows.length > 0 && (
          <div className="spend-breakdown">
            {categoryRows.map(([cat, amount]) => (
              <div key={cat} className="spend-row">
                <span className="property-tag">{cat}</span>
                <span className="spend-amount">{formatRand(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="group">
        <h2 className="group-label">Personal items</h2>
        {personalItems.length ? (
          <div className="card">
            {personalItems.map((e) => (
              <button className="spend-item spend-item-clickable" key={e.id} onClick={() => onEditPersonal(e)}>
                <div className="spend-item-main">
                  <span className="task-title">{e.description}</span>
                  <span className="task-sub">
                    {[e.category, formatDayShort(e.date)].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <span className="spend-amount">{formatRand(e.amount)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>No personal spend this month.</p>
            <p className="empty-hint">Tap + above to add an entry.</p>
          </div>
        )}
      </section>
    </div>
  );
}
