import React, { useState } from 'react';
import { 
  Inbox, 
  Calendar, 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  Settings, 
  BarChart3, 
  Flower2, 
  Folder, 
  Plus, 
  Menu, 
  X,
  Trash2
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ 
  currentTab, 
  setCurrentTab, 
  projects, 
  addProject, 
  deleteProject, 
  selectedProjectId, 
  setSelectedProjectId,
  mobileOpen,
  setMobileOpen
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);

  const focusTabs = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarDays },
    { id: 'someday', label: 'Someday', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    addProject(newProjectName.trim());
    setNewProjectName('');
    setShowAddProject(false);
  };

  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    setSelectedProjectId(null);
    setMobileOpen(false); // Close drawer on mobile
  };

  const handleProjectClick = (projectId) => {
    setCurrentTab('project');
    setSelectedProjectId(projectId);
    setMobileOpen(false); // Close drawer on mobile
  };

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Flower2 size={24} className="logo-icon" />
          <span>Lotus Planner</span>
        </div>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-title">Focus</div>
        <ul className="nav-list">
          {focusTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <li key={tab.id}>
                <button 
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="section-title">
          <span>Projects</span>
          <button className="add-btn" onClick={() => setShowAddProject(!showAddProject)}>
            <Plus size={14} />
          </button>
        </div>

        {showAddProject && (
          <form onSubmit={handleCreateProject} className="add-project-form">
            <input
              type="text"
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
            />
            <div className="form-actions">
              <button type="button" onClick={() => setShowAddProject(false)}>Cancel</button>
              <button type="submit" className="submit-btn">Create</button>
            </div>
          </form>
        )}

        <ul className="nav-list projects-list">
          {projects.map((proj) => {
            // Exclude the default Inbox if it is in focus
            if (proj.id === 'inbox') return null;
            const isActive = currentTab === 'project' && selectedProjectId === proj.id;
            return (
              <li key={proj.id} className="project-list-item">
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleProjectClick(proj.id)}
                >
                  <Folder size={16} style={{ color: proj.color }} />
                  <span>{proj.name}</span>
                </button>
                <button 
                  className="project-delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Are you sure you want to delete project "${proj.name}"? This won't delete its tasks.`)) {
                      deleteProject(proj.id);
                    }
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-section footer-section">
        <div className="section-title">AI & Settings</div>
        <ul className="nav-list">
          <li>
            <button 
              className={`nav-item ${currentTab === 'lotus' ? 'active' : ''}`}
              onClick={() => handleTabClick('lotus')}
            >
              <Flower2 size={16} className="ai-rainbow-icon" />
              <span>Lotus Blossom AI</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${currentTab === 'stats' ? 'active' : ''}`}
              onClick={() => handleTabClick('stats')}
            >
              <BarChart3 size={16} />
              <span>Stats Dashboard</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabClick('settings')}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <div className={`sidebar-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)}>
        <aside className={`sidebar-mobile ${mobileOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
