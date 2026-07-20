// One-time prompt: found tasks/spend in this browser's old localStorage
// store from before the Supabase move, and Supabase is currently empty.
// Offer to upload them once so nothing gets silently left behind.
export default function MigrationPrompt({ taskCount, spendCount, onUpload, onSkip }) {
  const parts = [];
  if (taskCount) parts.push(`${taskCount} task${taskCount === 1 ? '' : 's'}`);
  if (spendCount) parts.push(`${spendCount} spend ${spendCount === 1 ? 'entry' : 'entries'}`);

  return (
    <div className="sheet-overlay">
      <div className="sheet">
        <h2 className="sheet-title">Move your data to Supabase?</h2>
        <p className="quick-capture-hint" style={{ marginTop: 0 }}>
          This device has {parts.join(' and ')} saved locally from before sync was set up. Upload
          them now so they show up on your other devices too — this only happens once.
        </p>
        <div className="sheet-footer">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onSkip}>
            Skip
          </button>
          <button type="button" className="btn btn-primary" onClick={onUpload}>
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
