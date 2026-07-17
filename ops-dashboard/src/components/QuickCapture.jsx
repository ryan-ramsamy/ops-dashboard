import { useState } from 'react';

// Deliberately minimal: no category/property/due date fields, so
// capturing something never slows down for a decision that can wait.
export default function QuickCapture({ onSave, onClose }) {
  const [title, setTitle] = useState('');

  const save = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="sheet quick-capture-sheet" onSubmit={save}>
        <h2 className="sheet-title">Quick capture</h2>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          autoFocus
        />
        <p className="quick-capture-hint">Lands in Inbox — sort it into a section later.</p>
        <div className="sheet-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            Add to Inbox
          </button>
        </div>
      </form>
    </div>
  );
}
