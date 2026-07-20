import { useEffect, useRef } from 'react';

// Tight-arc offsets from the FAB's own position — kept close (≤~100px)
// on purpose, not a sweep across the screen. Order is the visual fan-out
// order (Today nearest-vertical, Schedule farthest toward horizontal).
const CHIPS = [
  {
    key: 'today',
    label: 'Today',
    dx: -6,
    dy: -78,
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" />
      </svg>
    ),
  },
  {
    key: 'tomorrow',
    label: 'Tomorrow',
    dx: -60,
    dy: -55,
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16M13 5l7 7-7 7" />
      </svg>
    ),
  },
  {
    key: 'schedule',
    label: 'Schedule',
    dx: -100,
    dy: -8,
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="16" rx="3" />
        <path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5" />
      </svg>
    ),
  },
];

// Tapping the FAB fans three date-shortcut chips out along a tight arc
// (ease-out, ~50ms stagger, no bounce/overshoot — see .fan-chip in
// styles.css). Tapping the FAB again, or tapping outside, collapses them
// back along the same CSS transition run in reverse — no separate
// "close" animation to maintain.
export default function FabMenu({ open, onToggle, onPick }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onToggle(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open, onToggle]);

  return (
    <div className="fab-wrap" ref={wrapRef}>
      {/* position:relative anchor so the fan can be absolutely positioned
          against the FAB's actual on-screen spot, not the full-width
          fixed .fab-wrap (which is wider than the centered content on
          large viewports). */}
      <div className="fab-anchor">
        <div className="fan-chips">
          {CHIPS.map((c, i) => (
            <button
              key={c.key}
              type="button"
              className={`fan-chip ${open ? 'fan-chip-open' : ''}`}
              style={{
                '--tx': `${c.dx}px`,
                '--ty': `${c.dy}px`,
                transitionDelay: `${(open ? i : CHIPS.length - 1 - i) * 50}ms`,
              }}
              tabIndex={open ? 0 : -1}
              onClick={() => onPick(c.key)}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <button
          className={`fab ${open ? 'fab-open' : ''}`}
          aria-label={open ? 'Close quick add' : 'Add task'}
          aria-expanded={open}
          onClick={() => onToggle(!open)}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
