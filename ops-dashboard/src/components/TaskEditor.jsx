import { useState } from 'react';
import { CATEGORIES, PROPERTIES, PRIORITIES, sentenceCase, parseAmount } from '../store.js';
import { localToday } from '../dates.js';

function ChipRow({ options, value, onChange, labels }) {
  return (
    <div className="chips form-chips">
      {options.map((opt) => (
        <button
          type="button"
          key={String(opt)}
          className={`chip ${value === opt ? 'selected' : ''}`}
          onClick={() => onChange(opt)}
        >
          {labels ? labels(opt) : sentenceCase(String(opt))}
        </button>
      ))}
    </div>
  );
}

export default function TaskEditor({ task, defaults = {}, onSave, onDelete, onClose }) {
  const base = task || {
    title: '',
    category: defaults.category || 'maintenance',
    property: defaults.property || null,
    priority: 'med',
    dueDate: defaults.dueDate !== undefined ? defaults.dueDate : localToday(),
    assignee: null,
    cost: null,
    notes: null,
    recurrence: null,
  };

  // Map a stored recurrence rule back onto the Repeat chips. Custom is
  // always day-based in this UI; week rules with interval > 1 (possible
  // via hand-edited backups) render as custom day counts.
  const rec = base.recurrence;
  const initialRepeat = !rec
    ? 'none'
    : rec.unit === 'month'
      ? 'monthly'
      : rec.unit === 'week' && rec.interval === 1
        ? 'weekly'
        : 'custom';
  const initialCustomDays = !rec || rec.unit === 'month' ? 7 : rec.unit === 'week' ? rec.interval * 7 : rec.interval;

  const [title, setTitle] = useState(base.title);
  const [category, setCategory] = useState(base.category);
  const [property, setProperty] = useState(base.property);
  const [priority, setPriority] = useState(base.priority);
  const [someday, setSomeday] = useState(!base.dueDate);
  const [dueDate, setDueDate] = useState(base.dueDate || localToday());
  const [assignee, setAssignee] = useState(base.assignee || '');
  const [cost, setCost] = useState(base.cost != null ? String(base.cost) : '');
  const [notes, setNotes] = useState(base.notes || '');
  const [repeat, setRepeat] = useState(initialRepeat);
  const [customDays, setCustomDays] = useState(String(initialCustomDays));
  // Collapsed by default in quick-add so it doesn't slow down fast entry —
  // but stays expanded when editing a task that already has notes.
  const [showNotes, setShowNotes] = useState(!!base.notes);

  const save = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const parsedCost = parseAmount(cost);
    const newDueDate = someday ? null : dueDate;
    const recurrence =
      someday || repeat === 'none'
        ? null
        : repeat === 'weekly'
          ? { unit: 'week', interval: 1 }
          : repeat === 'monthly'
            ? { unit: 'month', interval: 1 }
            : { unit: 'day', interval: Math.max(1, parseInt(customDays, 10) || 7) };
    onSave({
      title: trimmed,
      category,
      property,
      priority,
      dueDate: newDueDate,
      assignee: assignee.trim() || null,
      cost:
        category === 'maintenance' && Number.isFinite(parsedCost) && parsedCost > 0
          ? parsedCost
          : null,
      notes: notes.trim() || null,
      recurrence,
      // A deliberate date change means the task is no longer "overdue
      // from" anywhere — clear the rollover marker.
      ...(task && newDueDate !== task.dueDate ? { originalDueDate: null } : {}),
    });
  };

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="sheet" onSubmit={save}>
        <h2 className="sheet-title">{task ? 'Edit task' : 'New task'}</h2>

        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus={!task}
        />

        <label className="field-label">Category</label>
        <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />

        <label className="field-label">Property</label>
        <ChipRow
          options={[...PROPERTIES, null]}
          value={property}
          onChange={setProperty}
          labels={(p) => (p === null ? 'None' : p)}
        />

        <label className="field-label">Priority</label>
        <ChipRow options={PRIORITIES} value={priority} onChange={setPriority} />

        <label className="field-label">Due</label>
        <div className="due-row">
          <div className="chips form-chips">
            <button
              type="button"
              className={`chip ${!someday ? 'selected' : ''}`}
              onClick={() => setSomeday(false)}
            >
              Date
            </button>
            <button
              type="button"
              className={`chip ${someday ? 'selected' : ''}`}
              onClick={() => setSomeday(true)}
            >
              Someday
            </button>
          </div>
          {!someday && (
            <input
              className="input date-input"
              type="date"
              value={dueDate}
              onChange={(e) => e.target.value && setDueDate(e.target.value)}
            />
          )}
        </div>

        {!someday && (
          <>
            <label className="field-label">Repeat</label>
            <ChipRow options={['none', 'weekly', 'monthly', 'custom']} value={repeat} onChange={setRepeat} />
            {repeat === 'custom' && (
              <div className="custom-repeat">
                <span>Every</span>
                <input
                  className="input custom-days"
                  inputMode="numeric"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  aria-label="Repeat every this many days"
                />
                <span>days</span>
              </div>
            )}
          </>
        )}

        <label className="field-label">Assignee (optional)</label>
        <input
          className="input"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="e.g. Manuel"
        />

        {category === 'maintenance' && (
          <>
            <label className="field-label">Cost (R, optional)</label>
            <input
              className="input"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </>
        )}

        {showNotes ? (
          <>
            <label className="field-label" htmlFor="task-notes">
              Notes (optional)
            </label>
            <textarea
              id="task-notes"
              className="input textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Location details, specific times, extra context…"
              autoFocus
            />
          </>
        ) : (
          <button type="button" className="notes-toggle" onClick={() => setShowNotes(true)}>
            + Add notes
          </button>
        )}

        <div className="sheet-footer">
          {onDelete && (
            <button type="button" className="btn btn-danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            {task ? 'Save' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  );
}
