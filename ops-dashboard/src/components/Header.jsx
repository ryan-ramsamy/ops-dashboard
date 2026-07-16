import { useEffect, useRef, useState } from 'react';
import { downloadBackup, parseBackupFile } from '../store.js';

export default function Header({ tasks, onAdd, onImport }) {
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
      const { tasks: imported, count } = parseBackupFile(await file.text());
      const ok = window.confirm(
        `Import ${count} task${count === 1 ? '' : 's'}? They will be merged into your current ${tasks.length}.`
      );
      if (ok) onImport(imported);
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
                    downloadBackup(tasks);
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
