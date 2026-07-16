import { useState } from 'react';
import { useTasks } from './hooks/useTasks.js';
import { useSpend } from './hooks/useSpend.js';
import { localToday } from './dates.js';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import TasksView from './components/TasksView.jsx';
import CalendarView from './components/CalendarView.jsx';
import SpendView from './components/SpendView.jsx';
import TaskEditor from './components/TaskEditor.jsx';
import SpendEditor from './components/SpendEditor.jsx';

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

  const openAdd = () =>
    setEditor({ defaults: tab === 'calendar' ? { dueDate: selectedDate } : {} });
  const openEdit = (task) => setEditor({ task });

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
      <Header tasks={tasks} personalSpend={personalSpend} onImport={handleImport} onAdd={openAdd} />
      <main className="content">
        {tab === 'tasks' && (
          <TasksView tasks={tasks} onToggle={toggleDone} onEdit={openEdit} />
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
    </div>
  );
}
