import React, { useState, useEffect } from 'react';
import { 
  Flower2, 
  Plus, 
  ChevronRight, 
  ArrowLeft, 
  Trash2, 
  Download, 
  Loader2, 
  Folder,
  Settings,
  HelpCircle,
  CheckCircle,
  Play,
  Menu
} from 'lucide-react';
import { getLotusGrids, saveLotusGrids, addLotusGrid, updateLotusGrid, deleteLotusGrid, getProjects, addTask, getSettings } from '../utils/db';
import { decomposeLotusTask } from '../utils/agents';
import './LotusBlossom.css';

const LotusBlossom = ({ setMobileOpen }) => {
  const [grids, setGrids] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeGridId, setActiveGridId] = useState(null); // Current focused 3x3 grid
  const [isCreating, setIsCreating] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]); // Array of { agent, status, message, data }
  
  // Export states
  const [selectedPetals, setSelectedPetals] = useState(Array(9).fill(false)); // Index 1-8
  const [exportProject, setExportProject] = useState('inbox');
  const [exportPriority, setExportPriority] = useState('none');

  // Load data
  useEffect(() => {
    setGrids(getLotusGrids());
    setProjects(getProjects());
    
    const handleUpdate = () => setGrids(getLotusGrids());
    const handleProjUpdate = () => setProjects(getProjects());
    window.addEventListener('lotusUpdated', handleUpdate);
    window.addEventListener('projectsUpdated', handleProjUpdate);
    return () => {
      window.removeEventListener('lotusUpdated', handleUpdate);
      window.removeEventListener('projectsUpdated', handleProjUpdate);
    };
  }, []);

  const activeGrid = grids.find(g => g.id === activeGridId);

  // Reset selected petals when active grid changes
  useEffect(() => {
    setSelectedPetals(Array(9).fill(false));
  }, [activeGridId]);

  // Root grids (where parentId is null)
  const rootGrids = grids.filter(g => g.parentId === null);

  const handleCreateRoot = async (e) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    const settings = getSettings();
    if (!settings.apiKey) {
      alert('Please configure your API Key in Settings first to use the AI features!');
      return;
    }

    setIsLoading(true);
    setAgentLogs([]);

    try {
      const result = await decomposeLotusTask(goalInput.trim(), settings, (newLog) => {
        setAgentLogs(prev => [...prev, newLog]);
      });

      const rootId = `lotus-root-${Date.now()}`;
      const newGrid = {
        id: rootId,
        rootId: rootId,
        parentId: null,
        parentCellIndex: null,
        title: goalInput.trim(),
        cells: [goalInput.trim(), ...result.finalSubtasks],
        childGridIds: Array(9).fill(null),
        exportedCells: Array(9).fill(false)
      };

      addLotusGrid(newGrid);
      setGoalInput('');
      setIsCreating(false);
      setActiveGridId(rootId);
    } catch (error) {
      console.error(error);
      alert(`Decomposition failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecomposeDeep = async (petalIndex) => {
    if (!activeGrid) return;
    const subtaskTitle = activeGrid.cells[petalIndex];
    const settings = getSettings();
    if (!settings.apiKey) {
      alert('Please configure your API Key in Settings first to use the AI features!');
      return;
    }

    setIsLoading(true);
    setAgentLogs([]);

    try {
      const result = await decomposeLotusTask(subtaskTitle, settings, (newLog) => {
        setAgentLogs(prev => [...prev, newLog]);
      });

      const childId = `lotus-child-${Date.now()}`;
      const childGrid = {
        id: childId,
        rootId: activeGrid.rootId,
        parentId: activeGrid.id,
        parentCellIndex: petalIndex,
        title: subtaskTitle,
        cells: [subtaskTitle, ...result.finalSubtasks],
        childGridIds: Array(9).fill(null),
        exportedCells: Array(9).fill(false)
      };

      // Add child grid
      addLotusGrid(childGrid);

      // Update parent grid child pointer
      const updatedChildGridIds = [...activeGrid.childGridIds];
      updatedChildGridIds[petalIndex] = childId;
      updateLotusGrid(activeGrid.id, { childGridIds: updatedChildGridIds });

      setActiveGridId(childId);
    } catch (error) {
      console.error(error);
      alert(`Decomposition failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (gridId) => {
    if (confirm('Are you sure you want to delete this Lotus Blossom mind map? This will delete all connected sub-grids.')) {
      deleteLotusGrid(gridId);
      setActiveGridId(null);
    }
  };

  const handleExport = () => {
    if (!activeGrid) return;

    let exportedCount = 0;
    const updatedExportedCells = [...activeGrid.exportedCells];

    selectedPetals.forEach((isSelected, idx) => {
      if (isSelected && idx > 0 && !activeGrid.exportedCells[idx]) {
        addTask({
          title: activeGrid.cells[idx],
          description: `Generated via Lotus Blossom: "${activeGrid.title}"`,
          priority: exportPriority,
          dueDate: new Date().toISOString().split('T')[0], // Default to today
          project: exportProject,
          completed: false,
          checklist: [],
          tags: ['Lotus Blossom', activeGrid.title.substring(0, 15)],
        });
        updatedExportedCells[idx] = true;
        exportedCount++;
      }
    });

    if (exportedCount > 0) {
      updateLotusGrid(activeGrid.id, { exportedCells: updatedExportedCells });
      setSelectedPetals(Array(9).fill(false));
      alert(`Successfully exported ${exportedCount} tasks to your task list!`);
    } else {
      alert('Please select at least one unexported task to export.');
    }
  };

  // Breadcrumbs builder
  const getBreadcrumbs = () => {
    const crumbs = [];
    let current = activeGrid;
    while (current) {
      crumbs.unshift(current);
      current = grids.find(g => g.id === current.parentId);
    }
    return crumbs;
  };

  const togglePetalSelect = (index) => {
    if (index === 0) return; // Cannot select center
    if (activeGrid.exportedCells[index]) return; // Already exported
    const updated = [...selectedPetals];
    updated[index] = !updated[index];
    setSelectedPetals(updated);
  };

  const selectAllPetals = () => {
    const allSelectable = activeGrid.cells.map((_, idx) => {
      if (idx === 0) return false;
      return !activeGrid.exportedCells[idx];
    });
    setSelectedPetals(allSelectable);
  };

  // Map 1-8 to 3x3 positions:
  // 1 2 3
  // 4 0 5
  // 6 7 8
  const gridPositions = [
    { index: 0, row: 2, col: 2 }, // Center (cell 0)
    { index: 1, row: 1, col: 1 },
    { index: 2, row: 1, col: 2 },
    { index: 3, row: 1, col: 3 },
    { index: 4, row: 2, col: 1 },
    { index: 5, row: 2, col: 3 },
    { index: 6, row: 3, col: 1 },
    { index: 7, row: 3, col: 2 },
    { index: 8, row: 3, col: 3 }
  ];

  const getCellByCoords = (row, col) => {
    const pos = gridPositions.find(p => p.row === row && p.col === col);
    return pos ? pos.index : null;
  };

  return (
    <div className="lotus-view">
      {/* 1. Header */}
      <header className="lotus-header">
        <div className="header-left">
          {activeGridId ? (
            <button className="back-btn" onClick={() => setActiveGridId(null)}>
              <ArrowLeft size={16} />
              <span>Back to Lotus List</span>
            </button>
          ) : (
            <>
              <button type="button" className="mobile-menu-trigger" onClick={() => setMobileOpen(true)}>
                <Menu size={20} />
              </button>
              <Flower2 size={20} className="logo-icon" />
              <h2>Lotus Blossom Mind-Mapping</h2>
            </>
          )}
        </div>

        {!activeGridId && !isCreating && (
          <button className="create-lotus-btn" onClick={() => setIsCreating(true)}>
            <Plus size={16} />
            <span>New Lotus Goal</span>
          </button>
        )}
      </header>

      <div className="lotus-scroll-container">
        {/* Loading Overlay with Multi-Agent Logs */}
        {isLoading && (
          <div className="agent-loading-overlay">
            <div className="agent-log-card">
              <header className="agent-log-header">
                <Loader2 size={16} className="animate-spin" />
                <span>Multi-Agent Swarm Orchestrator active...</span>
              </header>

              <div className="agent-log-console">
                {agentLogs.map((log, idx) => (
                  <div key={idx} className={`log-entry ${log.status}`}>
                    <div className="log-meta">
                      <span className="log-agent">{log.agent}</span>
                      <span className={`log-badge ${log.status}`}>{log.status}</span>
                    </div>
                    <p className="log-text">{log.message}</p>
                    {log.data && (
                      <ul className="log-data-list">
                        {log.data.map((item, i) => (
                          <li key={i}>{i+1}. {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. List of root Lotus Blossom grids */}
        {!activeGridId && !isCreating && (
          <div className="lotus-grid-list">
            {rootGrids.length === 0 ? (
              <div className="empty-state">
                <Flower2 size={40} className="empty-state-icon" />
                <p className="empty-state-title">No Goals Decomposed Yet</p>
                <p className="empty-state-desc">
                  Break down large, intimidating projects into 3x3 grids of actionable tasks.
                </p>
                <button className="create-lotus-btn" style={{ marginTop: '16px' }} onClick={() => setIsCreating(true)}>
                  Create Your First Lotus Goal
                </button>
              </div>
            ) : (
              <div className="goals-cards-grid">
                {rootGrids.map(g => (
                  <div key={g.id} className="goal-card" onClick={() => setActiveGridId(g.id)}>
                    <div className="goal-card-header">
                      <Flower2 size={18} className="goal-card-icon" />
                      <h4>{g.title}</h4>
                    </div>
                    <p className="goal-card-desc">
                      Decomposed into {g.cells.length - 1} primary themes.
                    </p>
                    <div className="goal-card-footer">
                      <span>Click to view 3x3 Grid</span>
                      <button 
                        className="delete-goal-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(g.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Goal Creation Wizard */}
        {isCreating && (
          <div className="create-lotus-wizard">
            <div className="wizard-card">
              <header className="wizard-header">
                <h3>Decompose a Complex Goal</h3>
                <p>The system will use a Decomposer and Critic agent team to map out 8 distinct strategic branches.</p>
              </header>

              <form onSubmit={handleCreateRoot}>
                <div className="input-group">
                  <label htmlFor="goal">What is your core objective?</label>
                  <input
                    id="goal"
                    type="text"
                    placeholder="e.g., Launch a mobile fitness app, Plan a trip to Japan, Learn React..."
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* Templates Selector */}
                <div className="templates-selector-group">
                  <span className="templates-label">Or choose a quick template:</span>
                  <div className="templates-grid">
                    <button 
                      type="button" 
                      className="template-chip"
                      onClick={() => setGoalInput('Launch a SaaS Startup')}
                    >
                      🚀 Launch SaaS
                    </button>
                    <button 
                      type="button" 
                      className="template-chip"
                      onClick={() => setGoalInput('Master Conversational Spanish')}
                    >
                      📚 Learn Spanish
                    </button>
                    <button 
                      type="button" 
                      className="template-chip"
                      onClick={() => setGoalInput('Plan a 14-day Japan Vacation')}
                    >
                      ✈️ Japan Travel
                    </button>
                    <button 
                      type="button" 
                      className="template-chip"
                      onClick={() => setGoalInput('12-Week Gym Fitness Routine')}
                    >
                      🏋️‍♂️ Gym Routine
                    </button>
                  </div>
                </div>

                <div className="wizard-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsCreating(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={!goalInput.trim()}>
                    <Play size={14} />
                    Decompose using AI
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Active Lotus Zoom & Grid Panel */}
        {activeGridId && activeGrid && (
          <div className="active-lotus-panel">
            {/* Breadcrumbs */}
            <div className="lotus-breadcrumbs">
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <React.Fragment key={crumb.id}>
                  <button 
                    className={`crumb-btn ${idx === arr.length - 1 ? 'active' : ''}`}
                    onClick={() => setActiveGridId(crumb.id)}
                    disabled={idx === arr.length - 1}
                  >
                    {crumb.title}
                  </button>
                  {idx < arr.length - 1 && <ChevronRight size={12} className="crumb-arrow" />}
                </React.Fragment>
              ))}
            </div>

            <div className="lotus-workspace">
              {/* Interactive 3x3 Grid */}
              <div className="lotus-grid-container">
                <div className="lotus-grid-3x3">
                  {[1, 2, 3].map(row => (
                    <div key={row} className="lotus-grid-row">
                      {[1, 2, 3].map(col => {
                        const cellIndex = getCellByCoords(row, col);
                        const isCenter = cellIndex === 0;
                        const cellTitle = activeGrid.cells[cellIndex];
                        const isExported = activeGrid.exportedCells[cellIndex];
                        const childGridId = activeGrid.childGridIds[cellIndex];
                        const isSelected = selectedPetals[cellIndex];

                        if (isCenter) {
                          // Center Cell
                          return (
                            <div key={cellIndex} className="lotus-cell center-cell">
                              <div className="cell-content">
                                <Flower2 size={24} className="center-flower-icon" />
                                <span className="cell-text">{cellTitle}</span>
                                {activeGrid.parentId && (
                                  <button 
                                    className="zoom-out-btn" 
                                    onClick={() => setActiveGridId(activeGrid.parentId)}
                                    title="Go back to parent grid"
                                  >
                                    Zoom Out
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Petal Cells (1-8)
                        return (
                          <div 
                            key={cellIndex} 
                            className={`lotus-cell petal-cell ${isExported ? 'exported' : ''} ${isSelected ? 'selected' : ''} ${childGridId ? 'has-child' : ''}`}
                            onClick={() => togglePetalSelect(cellIndex)}
                          >
                            <div className="cell-checkbox">
                              {!isExported && (
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => {}} // Controlled by cell click
                                />
                              )}
                            </div>

                            <span className="cell-text">{cellTitle}</span>

                            <div className="cell-actions" onClick={e => e.stopPropagation()}>
                              {childGridId ? (
                                <button 
                                  className="zoom-in-btn" 
                                  onClick={() => setActiveGridId(childGridId)}
                                >
                                  Zoom In
                                </button>
                              ) : (
                                !isExported && (
                                  <button 
                                    className="decompose-deep-btn"
                                    onClick={() => handleDecomposeDeep(cellIndex)}
                                    title="Decompose this petal into its own 3x3 grid"
                                  >
                                    Decompose
                                  </button>
                                )
                              )}
                              
                              {isExported && (
                                <span className="exported-badge">
                                  <CheckCircle size={10} /> Exported
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Panel & Sidebar Controls */}
              <div className="lotus-controls">
                <div className="control-card">
                  <h4>Lotus Actions</h4>
                  
                  <div className="select-buttons">
                    <button className="secondary-btn" onClick={selectAllPetals}>
                      Select All
                    </button>
                    <button className="secondary-btn" onClick={() => setSelectedPetals(Array(9).fill(false))}>
                      Clear Selection
                    </button>
                  </div>

                  <hr className="divider" />

                  <h5>Export Selected to Tasks</h5>
                  <div className="control-group">
                    <label>
                      <Folder size={12} /> Target Project
                    </label>
                    <select 
                      value={exportProject} 
                      onChange={e => setExportProject(e.target.value)}
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group">
                    <label>
                      <Settings size={12} /> Task Priority
                    </label>
                    <select 
                      value={exportPriority} 
                      onChange={e => setExportPriority(e.target.value)}
                    >
                      <option value="none">No Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <button 
                    className="primary-btn export-submit-btn" 
                    onClick={handleExport}
                    disabled={!selectedPetals.some(v => v)}
                  >
                    <Download size={14} />
                    <span>Export Tasks</span>
                  </button>

                  <hr className="divider" />

                  <button 
                    className="danger-btn delete-lotus-tree"
                    onClick={() => handleDelete(activeGrid.rootId)}
                  >
                    <Trash2 size={14} />
                    Delete Entire Goal Mind-map
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LotusBlossom;
