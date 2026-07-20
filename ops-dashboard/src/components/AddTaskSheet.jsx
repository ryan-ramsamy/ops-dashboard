import { useState } from 'react';
import { CATEGORIES, sentenceCase } from '../store.js';
import { localToday, addDays, formatDayShort } from '../dates.js';

// The FAB's quick-add: title, category, and a due date already decided
// by which fan chip was tapped (Today/Tomorrow preset it silently;
// Schedule exposes the picker immediately). Property, priority, notes,
// and recurrence are refined later by tapping the task open (TaskEditor).
export default function AddTaskSheet({ onSave, onClose, defaultDueDate, showDatePicker = false }) {
  const today = localToday();
  const tomorrow = addDays(today, 1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('maintenance');
  const [dueDate, setDueDate] = useState(defaultDueDate || today);
  const [pickerOpen, setPickerOpen] = useState(showDatePicker);

  const dueLabel = dueDate === today ? 'Today' : dueDate === tomorrow ? 'Tomorrow' : formatDayShort(dueDate);

  const save = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ title: trimmed, category, dueDate });
  };

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="sheet" onSubmit={save}>
        <h2 className="sheet-title">New task</h2>

        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          autoFocus={!showDatePicker}
        />

        <label className="field-label">Category</label>
        <div className="chips form-chips">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              className={`chip ${category === c ? 'selected' : ''}`}
              onClick={() => setCategory(c)}
            >
              {sentenceCase(c)}
            </button>
          ))}
        </div>

        <label className="field-label">Due</label>
        {pickerOpen ? (
          <input
            className="input date-input"
            type="date"
            value={dueDate}
            onChange={(e) => e.target.value && setDueDate(e.target.value)}
            autoFocus={showDatePicker}
          />
        ) : (
          <button type="button" className="due-readout" onClick={() => setPickerOpen(true)}>
            <span>{dueLabel}</span>
            <span className="due-readout-change">Change</span>
          </button>
        )}

        <div className="sheet-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            Add task
          </button>
        </div>
      </form>
    </div>
  );
}
