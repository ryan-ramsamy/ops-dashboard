import { useState } from 'react';
import { useTasks } from './hooks/useTasks.js';
import { localToday } from './dates.js';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import TasksView from './components/TasksView.jsx';
import CalendarView from './components/CalendarView.jsx';
import SpendView from './components/SpendView.jsx';
import TaskEditor from './components/TaskEditor.jsx';

export default function App() {
  const { tasks, addTask, updateTask, toggleDone, deleteTask, importMerge } = useTasks();
  const [tab, setTab] = useState('tasks');
  const [selectedDate, setSelectedDate] = useState(localToday());
  const [editor, setEditor] = useState(null); // null | { task } | { defaults }

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

  return (
    <div className="app">
      <Header tasks={tasks} onAdd={openAdd} onImport={importMerge} />
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
        {tab === 'spend' && <SpendView tasks={tasks} />}
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
    </div>
  );
}
