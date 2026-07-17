import { useEffect, useRef, useState } from 'react';
import { downloadBackup, parseBackupFile } from '../store.js';

export default function Header({ tasks, personalSpend, onAdd, onImport, onQuickCapture, onOpenInbox, inboxCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = parseBackupFile(await file.text());
      const currentCount = tasks.length + personalSpend.length;
      const skippedNote = parsed.skipped > 0 ? `, ${parsed.skipped} skipped as invalid` : '';
      const ok = window.confirm(
        `Import ${parsed.count} item${parsed.count === 1 ? '' : 's'}${skippedNote}? They will be merged into your current ${currentCount}.`
      );
      if (ok) onImport(parsed);
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="header-title">Ops dashboard</h1>
        <div className="header-actions">
          <div className="menu-wrap" ref={menuRef}>
            <button
              className="icon-btn"
              aria-label="Backup menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <circle cx="5" cy="12" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {menuOpen && (
              <div className="menu" role="menu">
                <button
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    downloadBackup(tasks, personalSpend);
                  }}
                >
                  Export data
                </button>
                <button
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    fileRef.current.click();
                  }}
                >
                  Import data
                </button>
              </div>
            )}
          </div>
          <button className="icon-btn" aria-label="Quick capture" onClick={onQuickCapture}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
            </svg>
          </button>
          <button
            className="icon-btn"
            aria-label={inboxCount > 0 ? `Inbox, ${inboxCount} unsorted` : 'Inbox'}
            onClick={onOpenInbox}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h4l1.5 3h5L16 12h4M4 12l1.5-6.5A2 2 0 017.44 4h9.12a2 2 0 011.94 1.5L20 12M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
            </svg>
            {inboxCount > 0 && <span className="icon-badge">{inboxCount > 99 ? '99+' : inboxCount}</span>}
          </button>
          <button className="icon-btn" aria-label="Add task" onClick={onAdd}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={handleFile}
          />
        </div>
      </div>
    </header>
  );
}
