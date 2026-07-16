import { useEffect, useRef, useState } from 'react';
import TaskRow from './TaskRow.jsx';

// iOS-Mail-style swipe: drag left reveals a fixed-width red delete
// action; releasing past OPEN_THRESHOLD snaps it open (tap to delete),
// releasing past DELETE_THRESHOLD deletes immediately. Touch-only —
// desktop has no touchstart/move/end events, so its click-to-edit
// (and the editor's own Delete button) is completely unaffected.
const ACTION_WIDTH = 76;
const OPEN_THRESHOLD = 40;
const DELETE_THRESHOLD = 140;

export default function SwipeableTaskRow({
  task,
  onToggle,
  onEdit,
  onDeleteRequest,
  showDate,
  isOpen,
  onOpenChange,
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(null);
  const rawDeltaRef = useRef(0);

  useEffect(() => {
    if (!isOpen) setDragX(0);
  }, [isOpen]);

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    rawDeltaRef.current = 0;
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (startXRef.current == null) return;
    const delta = e.touches[0].clientX - startXRef.current;
    const base = isOpen ? -ACTION_WIDTH : 0;
    rawDeltaRef.current = base + delta;
    setDragX(Math.min(0, Math.max(base + delta, -ACTION_WIDTH)));
  };

  const onTouchEnd = () => {
    setDragging(false);
    startXRef.current = null;
    const raw = rawDeltaRef.current;
    if (raw <= -DELETE_THRESHOLD) {
      onDeleteRequest(task);
      setDragX(0);
      onOpenChange(false);
    } else if (raw <= -OPEN_THRESHOLD) {
      setDragX(-ACTION_WIDTH);
      onOpenChange(true);
    } else {
      setDragX(0);
      onOpenChange(false);
    }
  };

  const closeIfOpen = (e) => {
    if (dragX !== 0) {
      e.stopPropagation();
      e.preventDefault();
      setDragX(0);
      onOpenChange(false);
    }
  };

  return (
    <div className="swipe-row">
      <button
        className="swipe-delete-action"
        aria-label={`Delete ${task.title}`}
        onClick={() => {
          onDeleteRequest(task);
          setDragX(0);
          onOpenChange(false);
        }}
      >
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6h14M9 6V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V6m2 0v13a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 017 19V6h10z" />
        </svg>
      </button>
      <div
        className="swipe-content"
        style={{ transform: `translateX(${dragX}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={closeIfOpen}
      >
        <TaskRow task={task} onToggle={onToggle} onEdit={onEdit} showDate={showDate} />
      </div>
    </div>
  );
}
