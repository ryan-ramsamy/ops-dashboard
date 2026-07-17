import { formatDayShort } from '../dates.js';

export default function InboxView({ tasks, onTriage, onDelete, onClose }) {
  return (
    <div
      className="sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet inbox-sheet">
        <h2 className="sheet-title">Inbox{tasks.length > 0 ? ` (${tasks.length})` : ''}</h2>

        {tasks.length ? (
          <div className="card">
            {tasks.map((t) => (
              <div className="inbox-row" key={t.id}>
                <button className="inbox-row-main" onClick={() => onTriage(t)}>
                  <span className="task-title">{t.title}</span>
                  <span className="task-sub">Captured {formatDayShort(t.createdAt)}</span>
                </button>
                <button
                  className="icon-btn"
                  aria-label={`Delete "${t.title}"`}
                  onClick={() => {
                    if (window.confirm('Delete this item?')) onDelete(t.id);
                  }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>Inbox is empty.</p>
            <p className="empty-hint">Use Quick capture to dump something here without picking a section.</p>
          </div>
        )}

        <div className="sheet-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
