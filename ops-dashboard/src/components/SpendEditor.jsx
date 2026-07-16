import { useState } from 'react';
import { SPEND_CATEGORIES } from '../store.js';
import { localToday } from '../dates.js';

export default function SpendEditor({ entry, onSave, onDelete, onClose }) {
  const base = entry || { description: '', amount: '', category: '', date: localToday() };

  const [description, setDescription] = useState(base.description);
  const [amount, setAmount] = useState(base.amount ? String(base.amount) : '');
  const [category, setCategory] = useState(base.category || '');
  const [date, setDate] = useState(base.date);

  const parsedAmount = parseFloat(amount);
  const canSave = description.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const save = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      description: description.trim(),
      amount: parsedAmount,
      category: category.trim() || null,
      date,
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
        <h2 className="sheet-title">{entry ? 'Edit personal spend' : 'New personal spend'}</h2>

        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          autoFocus={!entry}
        />

        <label className="field-label">Amount (R)</label>
        <input
          className="input"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />

        <label className="field-label">Category (optional)</label>
        <input
          className="input"
          list="spend-category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Groceries"
        />
        <datalist id="spend-category-options">
          {SPEND_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <label className="field-label">Date</label>
        <input
          className="input date-input"
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />

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
          <button type="submit" className="btn btn-primary" disabled={!canSave}>
            {entry ? 'Save' : 'Add entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
