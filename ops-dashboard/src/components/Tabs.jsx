const TABS = [
  {
    id: 'now',
    label: 'Now',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.2l2.4 2.4 4.6-5.2" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Cal',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="16" rx="3" />
        <path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5" />
      </svg>
    ),
  },
  {
    id: 'spend',
    label: 'Spend',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5V14M10 19.5V9M16 19.5V11.5M22 19.5V5.5" transform="translate(-1 0)" />
      </svg>
    ),
  },
  {
    id: 'summary',
    label: 'Sum',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 3.5h6M8.5 10h7M8.5 13.5h7M8.5 17h4" />
      </svg>
    ),
  },
];

export default function Tabs({ tab, onChange, overdueCount = 0 }) {
  return (
    <nav className="tabs">
      <div className="tabs-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            <span className="tab-icon-wrap">
              {t.icon}
              {t.id === 'tasks' && overdueCount > 0 && (
                <span className="tab-badge">{overdueCount > 99 ? '99+' : overdueCount}</span>
              )}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
