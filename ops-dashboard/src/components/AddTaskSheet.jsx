import { useState } from 'react';
import { CATEGORIES, sentenceCase } from '../store.js';

// The FAB's quick-add: just a title and a category — due date defaults
// to today. Property, priority, notes, and recurrence are refined later
// by tapping the task open (TaskEditor).
export default function AddTaskSheet({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('maintenance');

  const save = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ title: trimmed, category });
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
          autoFocus
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
