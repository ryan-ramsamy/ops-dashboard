import { useEffect, useRef, useState } from 'react';
import { downloadBackup, parseBackupFile, sentenceCase } from '../store.js';

const THEME_OPTIONS = ['system', 'light', 'dark'];

export default function Header({
  tasks,
  personalSpend,
  onImport,
  onQuickCapture,
  onOpenInbox,
  inboxCount = 0,
  theme,
  onThemeChange,
  syncStatus,
  onLogout,
}) {
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
        <div className="header-title-wrap">
          <h1 className="header-title">Ops dashboard</h1>
          {syncStatus && syncStatus !== 'synced' && (
            <span
              className={`sync-pill sync-pill-${syncStatus}`}
              title={syncStatus === 'offline' ? "Can't reach Supabase — showing the last synced copy" : 'Loading from Supabase…'}
            >
              {syncStatus === 'offline' ? 'Offline' : 'Syncing…'}
            </span>
          )}
        </div>
        <div className="header-actions">
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
          <div className="menu-wrap" ref={menuRef}>
            <button
              className="icon-btn"
              aria-label="Menu"
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
                <div className="menu-section-label">Theme</div>
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    className={`menu-item ${theme === t ? 'menu-item-active' : ''}`}
                    onClick={() => onThemeChange(t)}
                  >
                    {sentenceCase(t)}
                  </button>
                ))}
                <div className="menu-divider" />
                <button
                  className="menu-item menu-item-danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
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
