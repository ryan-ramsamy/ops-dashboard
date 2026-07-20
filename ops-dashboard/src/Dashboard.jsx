import { useEffect, useState } from 'react';
import { useTasks } from './hooks/useTasks.js';
import { useSpend } from './hooks/useSpend.js';
import { localToday, addDays, isOverdue } from './dates.js';
import { getStoredTheme, applyTheme, storeTheme } from './theme.js';
import { readLegacyLocalData, fetchTasks, fetchPersonalSpend, MIGRATION_FLAG_KEY } from './sync.js';
import { supabase } from './supabaseClient.js';
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
import MigrationPrompt from './components/MigrationPrompt.jsx';
import FabMenu from './components/FabMenu.jsx';

// Everything that touches task/spend data. Only mounted once App.jsx has
// confirmed a signed-in session — useTasks/useSpend fire their first
// Supabase queries on mount, so keeping this out of the tree until then
// is what actually satisfies "no data loads before authenticated", not
// just hiding it visually.
export default function Dashboard() {
  const { tasks, addTask, updateTask, toggleDone, deleteTask, importMerge, syncState: tasksSyncState } = useTasks();
  const {
    personalSpend,
    addSpend,
    updateSpend,
    deleteSpend,
    importMergeSpend,
    syncState: spendSyncState,
  } = useSpend();
  const syncStatus = tasksSyncState === 'offline' || spendSyncState === 'offline'
    ? 'offline'
    : tasksSyncState === 'loading' || spendSyncState === 'loading'
      ? 'loading'
      : 'synced';
  const [tab, setTab] = useState('now');
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [editor, setEditor] = useState(null); // null | { task }
  const [spendEditor, setSpendEditor] = useState(null); // null | { entry } | {}
  const [fanOpen, setFanOpen] = useState(false);
  const [addTaskDefaults, setAddTaskDefaults] = useState(null); // null | { dueDate, showPicker }
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

  // One-time check: this browser has data in the pre-Supabase localStorage
  // keys, and Supabase is currently empty (so it isn't already synced from
  // elsewhere) — offer to upload it once. Only runs until MIGRATION_FLAG_KEY
  // is set, which happens either way (upload, skip, or "nothing to migrate").
  const [migration, setMigration] = useState(null); // null | { tasks, personalSpend }
  useEffect(() => {
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) return;
    const legacy = readLegacyLocalData();
    if (!legacy.tasks.length && !legacy.personalSpend.length) {
      localStorage.setItem(MIGRATION_FLAG_KEY, '1');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [supaTasks, supaSpend] = await Promise.all([fetchTasks(), fetchPersonalSpend()]);
        if (cancelled) return;
        if (supaTasks.length === 0 && supaSpend.length === 0) {
          setMigration(legacy);
        } else {
          // Supabase already has data (synced from another device) —
          // don't clobber it with this device's old local copy.
          localStorage.setItem(MIGRATION_FLAG_KEY, '1');
        }
      } catch {
        /* offline on first run — the flag stays unset, so this is retried next load */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMigrationUpload = () => {
    if (migration.tasks.length) importMerge(migration.tasks);
    if (migration.personalSpend.length) importMergeSpend(migration.personalSpend);
    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
    setMigration(null);
  };

  const handleMigrationSkip = () => {
    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
    setMigration(null);
  };

  // "n" opens quick-add from anywhere — mirrors the FAB, for the
  // laptop/browser-tab use case where there's no thumb reaching for a
  // corner button. Bypasses the fan-out arc entirely (defaults to Today,
  // the same as the arc's fastest chip) since a keyboard shortcut is
  // already a one-step power-user path. Ignored while typing in any
  // field, or a sheet is open.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (editor || spendEditor || quickCaptureOpen || inboxOpen || addTaskDefaults) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return;
      e.preventDefault();
      setAddTaskDefaults({ dueDate: localToday(), showPicker: false });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, spendEditor, quickCaptureOpen, inboxOpen, addTaskDefaults]);

  // The fan chip picked decides the preset due date and whether the
  // sheet opens with the date picker already exposed (Schedule) or
  // collapsed into a quick "Today"/"Tomorrow" readout.
  const openAddTask = (key) => {
    setFanOpen(false);
    const today = localToday();
    if (key === 'tomorrow') setAddTaskDefaults({ dueDate: addDays(today, 1), showPicker: false });
    else if (key === 'schedule') setAddTaskDefaults({ dueDate: today, showPicker: true });
    else setAddTaskDefaults({ dueDate: today, showPicker: false });
  };

  const handleAddTask = ({ title, category, dueDate }) => {
    addTask({ title, category, dueDate });
    setAddTaskDefaults(null);
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
        syncStatus={syncStatus}
        onLogout={() => supabase.auth.signOut()}
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

      <FabMenu open={fanOpen} onToggle={setFanOpen} onPick={openAddTask} />

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
      {addTaskDefaults && (
        <AddTaskSheet
          onSave={handleAddTask}
          onClose={() => setAddTaskDefaults(null)}
          defaultDueDate={addTaskDefaults.dueDate}
          showDatePicker={addTaskDefaults.showPicker}
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
      {migration && (
        <MigrationPrompt
          taskCount={migration.tasks.length}
          spendCount={migration.personalSpend.length}
          onUpload={handleMigrationUpload}
          onSkip={handleMigrationSkip}
        />
      )}
    </div>
  );
}
