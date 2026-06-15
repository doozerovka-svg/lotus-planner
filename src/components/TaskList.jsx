import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  Flag, 
  ArrowUpDown, 
  Menu,
  CheckCircle2,
  Circle
} from 'lucide-react';
import './TaskList.css';

const TaskList = ({ 
  tasks, 
  projects, 
  currentTab, 
  selectedProjectId, 
  addTask, 
  toggleTaskComplete, 
  deleteTask, 
  setSelectedTask,
  setMobileOpen 
}) => {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate'); // 'dueDate' | 'priority' | 'title'
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('none');

  // Find active project metadata
  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Helper to check if task due date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  // Helper to check if task due date is in the future
  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr > today;
  };

  // Filter tasks by active sidebar view
  const getFilteredTasksByView = () => {
    switch (currentTab) {
      case 'inbox':
        // Inbox view shows all uncompleted tasks
        return tasks.filter(t => !t.completed);
      case 'today':
        return tasks.filter(t => !t.completed && isToday(t.dueDate));
      case 'upcoming':
        return tasks.filter(t => !t.completed && isUpcoming(t.dueDate));
      case 'someday':
        return tasks.filter(t => !t.completed && !t.dueDate);
      case 'completed':
        return tasks.filter(t => t.completed);
      case 'project':
        return tasks.filter(t => t.project === selectedProjectId);
      default:
        return tasks;
    }
  };

  const filteredByView = getFilteredTasksByView();

  // Apply Search and Priority filters
  const processedTasks = filteredByView
    .filter(task => {
      const matchSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
      const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchSearch && matchPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1, none: 0 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    // Prefill fields based on active tab
    let dueDate = null;
    let project = selectedProjectId || 'inbox';

    if (currentTab === 'today') {
      dueDate = new Date().toISOString().split('T')[0];
    } else if (currentTab === 'upcoming') {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
    }

    addTask({
      title: quickTitle.trim(),
      priority: quickPriority,
      dueDate,
      project
    });

    setQuickTitle('');
    setQuickPriority('none');
  };

  const getPriorityIconColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return 'var(--text-muted)';
    }
  };

  const getHeaderTitle = () => {
    if (currentTab === 'project') return activeProject ? activeProject.name : 'Project';
    return currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
  };

  return (
    <div className="task-list-view">
      <header className="task-list-header">
        <div className="header-left">
          <button className="mobile-menu-trigger" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <h2>{getHeaderTitle()}</h2>
          <span className="task-count-badge">{processedTasks.length}</span>
        </div>

        <div className="header-actions">
          {/* Search bar */}
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Priority filter */}
          <select 
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">No Priority</option>
          </select>

          {/* Sort selector */}
          <div className="sort-wrapper">
            <ArrowUpDown size={14} className="sort-icon" />
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </header>

      {/* Quick Add Form */}
      {currentTab !== 'completed' && (
        <form onSubmit={handleQuickAdd} className="quick-add-form">
          <div className="quick-add-input-wrapper">
            <Plus size={16} className="quick-add-plus" />
            <input
              type="text"
              placeholder={`Add task to ${getHeaderTitle()}... (Press Enter)`}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
          </div>

          <div className="quick-add-actions">
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value)}
              className="quick-priority-select"
              style={{ color: getPriorityIconColor(quickPriority) }}
            >
              <option value="none">Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit" className="quick-add-submit" disabled={!quickTitle.trim()}>
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Task List Scroll Area */}
      <div className="tasks-scroll-container">
        {processedTasks.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={40} className="empty-state-icon" />
            <p className="empty-state-title">All caught up!</p>
            <p className="empty-state-desc">No tasks match your criteria or filters.</p>
          </div>
        ) : (
          <div className="tasks-list">
            {processedTasks.map((task) => {
              const proj = projects.find(p => p.id === task.project);
              const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && !task.completed;

              return (
                <div 
                  key={task.id} 
                  className={`task-row ${task.completed ? 'completed' : ''}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <button 
                    className="task-checkbox"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskComplete(task.id);
                    }}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={18} className="checkbox-checked" />
                    ) : (
                      <Circle size={18} className="checkbox-unchecked" />
                    )}
                  </button>

                  <div className="task-main-info">
                    <span className="task-title-text">{task.title}</span>
                    <div className="task-meta-row">
                      {proj && (
                        <span className="task-project-tag">
                          <span className="project-color-dot" style={{ backgroundColor: proj.color }}></span>
                          {proj.name}
                        </span>
                      )}
                      
                      {task.dueDate && (
                        <span className={`task-due-tag ${isOverdue ? 'overdue' : ''}`}>
                          <Calendar size={12} />
                          {isToday(task.dueDate) ? 'Today' : task.dueDate}
                        </span>
                      )}

                      {task.checklist && task.checklist.length > 0 && (
                        <span className="task-checklist-tag">
                          {task.checklist.filter(c => c.completed).length}/{task.checklist.length} subtasks
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-row-right" onClick={(e) => e.stopPropagation()}>
                    {task.priority !== 'none' && (
                      <span className={`priority-badge ${task.priority}`}>
                        {task.priority}
                      </span>
                    )}

                    <button 
                      className="task-delete-btn"
                      onClick={() => {
                        if (confirm(`Delete task "${task.title}"?`)) {
                          deleteTask(task.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
