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
  };

  const [title, setTitle] = useState(base.title);
  const [category, setCategory] = useState(base.category);
  const [property, setProperty] = useState(base.property);
  const [priority, setPriority] = useState(base.priority);
  const [someday, setSomeday] = useState(!base.dueDate);
  const [dueDate, setDueDate] = useState(base.dueDate || localToday());
  const [assignee, setAssignee] = useState(base.assignee || '');
  const [cost, setCost] = useState(base.cost != null ? String(base.cost) : '');
  const [notes, setNotes] = useState(base.notes || '');
  // Collapsed by default in quick-add so it doesn't slow down fast entry —
  // but stays expanded when editing a task that already has notes.
  const [showNotes, setShowNotes] = useState(!!base.notes);

  const save = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const parsedCost = parseAmount(cost);
    onSave({
      title: trimmed,
      category,
      property,
      priority,
      dueDate: someday ? null : dueDate,
      assignee: assignee.trim() || null,
      cost:
        category === 'maintenance' && Number.isFinite(parsedCost) && parsedCost > 0
          ? parsedCost
          : null,
      notes: notes.trim() || null,
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
