import { useEffect, useState } from 'react';
import { useTasks } from './hooks/useTasks.js';
import { useSpend } from './hooks/useSpend.js';
import { localToday, addDays, isOverdue } from './dates.js';
import { getStoredTheme, applyTheme, storeTheme } from './theme.js';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import NowView from './components/NowView.jsx';
import TasksView from './components/TasksView.jsx';
import CalendarView from './components/CalendarView.jsx';
import SpendView from './components/SpendView.jsx';
import SummaryView from './components/SummaryView.jsx';
import TaskEditor from './components/TaskEditor.jsx';
import SpendEditor from './components/SpendEditor.jsx';
import QuickCapture from './components/QuickCapture.jsx';
import InboxView from './components/InboxView.jsx';
import AddTaskSheet from './components/AddTaskSheet.jsx';

export default function App() {
  const { tasks, addTask, updateTask, toggleDone, deleteTask, importMerge } = useTasks();
  const {
    personalSpend,
    addSpend,
    updateSpend,
    deleteSpend,
    importMergeSpend,
  } = useSpend();
  const [tab, setTab] = useState('now');
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [editor, setEditor] = useState(null); // null | { task }
  const [spendEditor, setSpendEditor] = useState(null); // null | { entry } | {}
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => applyTheme(theme), [theme]);
  const changeTheme = (t) => {
    storeTheme(t);
    setTheme(t);
  };

  const inboxTasks = tasks.filter((t) => t.inbox && !t.done);
  const overdueCount = tasks.filter(isOverdue).length;

  const openEdit = (task) => setEditor({ task });

  // "n" opens quick-add from anywhere — mirrors the FAB, for the
  // laptop/browser-tab use case where there's no thumb reaching for a
  // corner button. Ignored while typing in any field, or a sheet is open.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (editor || spendEditor || quickCaptureOpen || inboxOpen || addTaskOpen) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return;
      e.preventDefault();
      setAddTaskOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, spendEditor, quickCaptureOpen, inboxOpen, addTaskOpen]);

  const handleAddTask = ({ title, category }) => {
    addTask({ title, category, dueDate: localToday() });
    setAddTaskOpen(false);
  };

  const handleQuickCapture = (title) => {
    addTask({ title, inbox: true });
    setQuickCaptureOpen(false);
  };

  // Triaging an Inbox item reuses the full task editor — closing the
  // Inbox sheet first avoids stacking two sheets on top of each other.
  const handleTriage = (task) => {
    setInboxOpen(false);
    openEdit(task);
  };

  const handleSnooze = (task) =>
    updateTask(task.id, {
      dueDate: addDays(task.dueDate || localToday(), 1),
      originalDueDate: null,
    });

  const handleSave = (values) => {
    updateTask(editor.task.id, values);
    setEditor(null);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      deleteTask(editor.task.id);
      setEditor(null);
    }
  };

  const handleSpendSave = (values) => {
    if (spendEditor.entry) updateSpend(spendEditor.entry.id, values);
    else addSpend(values);
    setSpendEditor(null);
  };

  const handleSpendDelete = () => {
    if (window.confirm('Delete this entry?')) {
      deleteSpend(spendEditor.entry.id);
      setSpendEditor(null);
    }
  };

  const handleImport = ({ tasks: importedTasks, personalSpend: importedSpend }) => {
    if (importedTasks?.length) importMerge(importedTasks);
    if (importedSpend?.length) importMergeSpend(importedSpend);
  };

  return (
    <div className="app">
      <Header
        tasks={tasks}
        personalSpend={personalSpend}
        onImport={handleImport}
        onQuickCapture={() => setQuickCaptureOpen(true)}
        onOpenInbox={() => setInboxOpen(true)}
        inboxCount={inboxTasks.length}
        theme={theme}
        onThemeChange={changeTheme}
      />
      <main className="content">
        {tab === 'now' && (
          <NowView tasks={tasks} onToggle={toggleDone} onEdit={openEdit} onSnooze={handleSnooze} />
        )}
        {tab === 'tasks' && (
          <TasksView tasks={tasks} onToggle={toggleDone} onEdit={openEdit} onSnooze={handleSnooze} />
        )}
        {tab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            selected={selectedDate}
            onSelect={setSelectedDate}
            onToggle={toggleDone}
            onEdit={openEdit}
          />
        )}
        {tab === 'spend' && (
          <SpendView
            tasks={tasks}
            personalSpend={personalSpend}
            onAddPersonal={() => setSpendEditor({})}
            onEditPersonal={(entry) => setSpendEditor({ entry })}
          />
        )}
        {tab === 'summary' && <SummaryView tasks={tasks} inboxCount={inboxTasks.length} />}
      </main>
      <Tabs tab={tab} onChange={setTab} overdueCount={overdueCount} />

      <div className="fab-wrap">
        <button className="fab" aria-label="Add task" onClick={() => setAddTaskOpen(true)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {editor && (
        <TaskEditor
          task={editor.task}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditor(null)}
        />
      )}
      {spendEditor && (
        <SpendEditor
          entry={spendEditor.entry}
          onSave={handleSpendSave}
          onDelete={spendEditor.entry ? handleSpendDelete : undefined}
          onClose={() => setSpendEditor(null)}
        />
      )}
      {addTaskOpen && <AddTaskSheet onSave={handleAddTask} onClose={() => setAddTaskOpen(false)} />}
      {quickCaptureOpen && (
        <QuickCapture onSave={handleQuickCapture} onClose={() => setQuickCaptureOpen(false)} />
      )}
      {inboxOpen && (
        <InboxView
          tasks={inboxTasks}
          onTriage={handleTriage}
          onDelete={deleteTask}
          onClose={() => setInboxOpen(false)}
        />
      )}
    </div>
  );
}
