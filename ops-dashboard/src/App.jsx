import { useEffect, useState } from 'react';
import { useTasks } from './hooks/useTasks.js';
import { useSpend } from './hooks/useSpend.js';
import { localToday } from './dates.js';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import TasksView from './components/TasksView.jsx';
import CalendarView from './components/CalendarView.jsx';
import SpendView from './components/SpendView.jsx';
import SummaryView from './components/SummaryView.jsx';
import TaskEditor from './components/TaskEditor.jsx';
import SpendEditor from './components/SpendEditor.jsx';
import QuickCapture from './components/QuickCapture.jsx';
import InboxView from './components/InboxView.jsx';

export default function App() {
  const { tasks, addTask, updateTask, toggleDone, deleteTask, importMerge } = useTasks();
  const {
    personalSpend,
    addSpend,
    updateSpend,
    deleteSpend,
    importMergeSpend,
  } = useSpend();
  const [tab, setTab] = useState('tasks');
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [editor, setEditor] = useState(null); // null | { task } | { defaults }
  const [spendEditor, setSpendEditor] = useState(null); // null | { entry } | {}
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);

  const inboxTasks = tasks.filter((t) => t.inbox && !t.done);

  const openAdd = () =>
    setEditor({ defaults: tab === 'calendar' ? { dueDate: selectedDate } : {} });
  const openEdit = (task) => setEditor({ task });

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

  // "n" opens quick-add from anywhere on the Tasks/Calendar tabs (mirrors
  // the header's + button) — for the laptop/browser-tab use case, where
  // there's no thumb reaching for a corner button. Ignored while typing
  // in any field, or while a sheet is already open.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (editor || spendEditor || quickCaptureOpen || inboxOpen) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return;
      e.preventDefault();
      openAdd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, selectedDate, editor, spendEditor, quickCaptureOpen, inboxOpen]);

  const handleSave = (values) => {
    if (editor.task) updateTask(editor.task.id, values);
    else addTask(values);
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
        onAdd={openAdd}
        onQuickCapture={() => setQuickCaptureOpen(true)}
        onOpenInbox={() => setInboxOpen(true)}
        inboxCount={inboxTasks.length}
      />
      <main className="content">
        {tab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onToggle={toggleDone}
            onEdit={openEdit}
            onDelete={deleteTask}
            onAdd={openAdd}
          />
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
      <Tabs tab={tab} onChange={setTab} />
      {editor && (
        <TaskEditor
          task={editor.task}
          defaults={editor.defaults}
          onSave={handleSave}
          onDelete={editor.task ? handleDelete : undefined}
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
