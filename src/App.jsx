import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import TaskDetails from './components/TaskDetails';
import LotusBlossom from './components/LotusBlossom';
import StatsDashboard from './components/StatsDashboard';
import Settings from './components/Settings';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import { 
  getTasks, 
  saveTasks, 
  getProjects, 
  saveProjects, 
  getSettings 
} from './utils/db';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentTab, setCurrentTab] = useState('inbox');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load and synchronize data
  useEffect(() => {
    // Initial Load
    setTasks(getTasks());
    setProjects(getProjects());
    
    // Apply theme on load
    const settings = getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

    // DB listeners
    const handleTasksUpdate = () => setTasks(getTasks());
    const handleProjectsUpdate = () => setProjects(getProjects());
    const handleDbReset = () => {
      setTasks(getTasks());
      setProjects(getProjects());
      setCurrentTab('inbox');
      setSelectedProjectId(null);
      setSelectedTask(null);
    };

    window.addEventListener('tasksUpdated', handleTasksUpdate);
    window.addEventListener('projectsUpdated', handleProjectsUpdate);
    window.addEventListener('dbReset', handleDbReset);

    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdate);
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
      window.removeEventListener('dbReset', handleDbReset);
    };
  }, []);

  // Sync selectedTask reference if tasks list updates in background
  useEffect(() => {
    if (selectedTask) {
      const freshTask = tasks.find(t => t.id === selectedTask.id);
      if (freshTask) {
        setSelectedTask(freshTask);
      } else {
        setSelectedTask(null); // Deleted in background
      }
    }
  }, [tasks, selectedTask]);

  // Task Handlers
  const handleAddTask = ({ title, priority, dueDate, project }) => {
    const newId = `task-${Date.now()}`;
    const newTask = {
      id: newId,
      title,
      description: '',
      priority: priority || 'none',
      dueDate: dueDate || null,
      project: project || 'inbox',
      completed: false,
      checklist: [],
      tags: [],
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleToggleTaskComplete = (taskId) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const completedState = !t.completed;
        return {
          ...t,
          completed: completedState,
          completedAt: completedState ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleUpdateTask = (taskId, updates) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null);
    }
  };

  // Project Handlers
  const handleAddProject = (projectName) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newId = `project-${Date.now()}`;
    
    const newProject = {
      id: newId,
      name: projectName,
      color: randomColor,
      icon: 'Folder'
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
  };

  const handleDeleteProject = (projectId) => {
    // Delete project
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    saveProjects(updatedProjects);

    // Re-assign tasks to inbox
    const updatedTasks = tasks.map(t => 
      t.project === projectId ? { ...t, project: 'inbox' } : t
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    // Redirect active views
    if (selectedProjectId === projectId) {
      setCurrentTab('inbox');
      setSelectedProjectId(null);
    }
  };

  // Render the appropriate main workspace view
  const renderMainView = () => {
    switch (currentTab) {
      case 'lotus':
        return <LotusBlossom />;
      case 'stats':
        return <StatsDashboard />;
      case 'settings':
        return <Settings />;
      case 'matrix':
        return (
          <EisenhowerMatrix
            tasks={tasks}
            projects={projects}
            toggleTaskComplete={handleToggleTaskComplete}
            deleteTask={handleDeleteTask}
            updateTask={handleUpdateTask}
            addTask={handleAddTask}
            setMobileOpen={setMobileOpen}
          />
        );
      default:
        // Inbox, Today, Upcoming, Someday, Completed, or Project lists
        return (
          <TaskList
            tasks={tasks}
            projects={projects}
            currentTab={currentTab}
            selectedProjectId={selectedProjectId}
            addTask={handleAddTask}
            toggleTaskComplete={handleToggleTaskComplete}
            deleteTask={handleDeleteTask}
            updateTask={handleUpdateTask}
            setSelectedTask={setSelectedTask}
            setMobileOpen={setMobileOpen}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        projects={projects}
        addProject={handleAddProject}
        deleteProject={handleDeleteProject}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Panel Viewport */}
      <main className="main-content">
        {renderMainView()}
      </main>

      {/* Slide-over Task Editing Drawer */}
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          projects={projects}
          onUpdateTask={handleUpdateTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default App;
