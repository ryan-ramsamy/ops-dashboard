import { useMemo, useState } from 'react';
import {
  localToday,
  getMonthGrid,
  getWeekDays,
  addMonths,
  addDays,
  monthKeyOf,
  formatMonthYear,
  formatDayShort,
  formatDayLong,
} from '../dates.js';
import { byPriority } from '../sorting.js';
import TaskRow from './TaskRow.jsx';
import MonthNav from './MonthNav.jsx';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView({ tasks, selected, onSelect, onToggle, onEdit }) {
  const [mode, setMode] = useState('month');
  const [anchor, setAnchor] = useState(selected);
  const today = localToday();

  // date -> 'open' (at least one open task) or 'done' (only finished ones)
  const dots = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.dueDate) continue;
      if (!t.done) map[t.dueDate] = 'open';
      else if (!map[t.dueDate]) map[t.dueDate] = 'done';
    }
    return map;
  }, [tasks]);

  const move = (dir) => {
    if (mode === 'month') setAnchor(addMonths(monthKeyOf(anchor), dir) + '-01');
    else setAnchor(addDays(anchor, dir * 7));
  };

  const jumpToday = () => {
    setAnchor(today);
    onSelect(today);
  };

  const weekDays = mode === 'week' ? getWeekDays(anchor) : null;
  const label =
    mode === 'month'
      ? formatMonthYear(monthKeyOf(anchor))
      : `${formatDayShort(weekDays[0])} – ${formatDayShort(weekDays[6])}`;

  const dayTasks = tasks.filter((t) => t.dueDate === selected).sort(byPriority);

  const dayCell = (date, inMonth = true) => (
    <button
      key={date}
      className={[
        'day',
        inMonth ? '' : 'out',
        date === today ? 'today' : '',
        date === selected ? 'selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect(date)}
    >
      <span className="day-num">{Number(date.slice(8))}</span>
      <span className={`dot ${dots[date] || 'none'}`} />
    </button>
  );

  return (
    <div className="calendar-view">
      <div className="cal-top">
        <div className="segmented">
          <button
            className={mode === 'month' ? 'selected' : ''}
            onClick={() => setMode('month')}
          >
            Month
          </button>
          <button
            className={mode === 'week' ? 'selected' : ''}
            onClick={() => {
              setMode('week');
              setAnchor(selected);
            }}
          >
            Week
          </button>
        </div>
        <button className="btn btn-small" onClick={jumpToday}>
          Today
        </button>
      </div>

      <div className="card cal-card">
        <MonthNav label={label} onPrev={() => move(-1)} onNext={() => move(1)} />

        <div className="cal-weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {mode === 'month' ? (
          getMonthGrid(monthKeyOf(anchor)).map((week, i) => (
            <div className="cal-row" key={i}>
              {week.map((cell) => dayCell(cell.date, cell.inMonth))}
            </div>
          ))
        ) : (
          <div className="cal-row">{weekDays.map((d) => dayCell(d))}</div>
        )}
      </div>

      <section className="group">
        <h2 className="group-label">{formatDayLong(selected)}</h2>
        {dayTasks.length ? (
          <div className="card">
            {dayTasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>Nothing due this day.</p>
            <p className="empty-hint">Tap + to add a task on this date.</p>
          </div>
        )}
      </section>
    </div>
  );
}
