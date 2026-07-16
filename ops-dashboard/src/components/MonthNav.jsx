// Shared prev/label/next nav bar — used by CalendarView (month/week
// label) and SpendView (month label), which previously duplicated this
// markup and its chevron SVGs independently.
export default function MonthNav({ label, onPrev, onNext, prevLabel = 'Previous', nextLabel = 'Next', standalone = false }) {
  return (
    <div className={`cal-nav ${standalone ? 'standalone' : ''}`}>
      <button className="icon-btn" aria-label={prevLabel} onClick={onPrev}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 6l-6 6 6 6" />
        </svg>
      </button>
      <span className="cal-label">{label}</span>
      <button className="icon-btn" aria-label={nextLabel} onClick={onNext}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
