import { useEffect, useRef, useState } from 'react';
import TaskRow from './TaskRow.jsx';

// iOS-Mail-style swipe: dragging left reveals a fixed two-action tray
// (Done, Snooze) behind the card. Touch only — desktop has no
// touchstart/move/end events, so its click-to-edit is unaffected.
// The checkbox still toggles complete directly; no swipe required.
const ACTION_WIDTH = 120; // two 60px actions
const OPEN_THRESHOLD = 40;

export default function SwipeableTaskRow({
  task,
  onToggle,
  onEdit,
  onSnooze,
  variant,
  size,
  openDir, // 0 (closed) | -1 (open)
  onOpenChange,
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(null);
  const rawDeltaRef = useRef(0);

  useEffect(() => {
    setDragX(openDir ? -ACTION_WIDTH : 0);
  }, [openDir]);

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    rawDeltaRef.current = 0;
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (startXRef.current == null) return;
    const delta = e.touches[0].clientX - startXRef.current;
    const base = openDir ? -ACTION_WIDTH : 0;
    rawDeltaRef.current = base + delta;
    setDragX(Math.min(0, Math.max(base + delta, -ACTION_WIDTH)));
  };

  const onTouchEnd = () => {
    setDragging(false);
    startXRef.current = null;
    if (rawDeltaRef.current <= -OPEN_THRESHOLD) {
      setDragX(-ACTION_WIDTH);
      onOpenChange(-1);
    } else {
      setDragX(0);
      onOpenChange(0);
    }
  };

  const closeIfOpen = (e) => {
    if (dragX !== 0) {
      e.stopPropagation();
      e.preventDefault();
      setDragX(0);
      onOpenChange(0);
    }
  };

  return (
    <div className="swipe-row">
      <div className="swipe-actions">
        <button
          className="swipe-action swipe-action-done"
          aria-label={`Mark ${task.title} as done`}
          onClick={() => {
            onToggle(task.id);
            setDragX(0);
            onOpenChange(0);
          }}
        >
          Done
        </button>
        <button
          className="swipe-action swipe-action-snooze"
          aria-label={`Snooze ${task.title} to tomorrow`}
          onClick={() => {
            onSnooze(task);
            setDragX(0);
            onOpenChange(0);
          }}
        >
          Snooze
        </button>
      </div>
      <div
        className="swipe-content"
        style={{ transform: `translateX(${dragX}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={closeIfOpen}
      >
        <TaskRow task={task} onToggle={onToggle} onEdit={onEdit} variant={variant} size={size} />
      </div>
    </div>
  );
}
