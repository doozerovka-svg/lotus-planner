import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  AlertCircle,
  HelpCircle,
  Menu,
  ChevronRight,
  TrendingUp,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  Minus,
  Mic
} from 'lucide-react';
import './EisenhowerMatrix.css';

const EisenhowerMatrix = ({ 
  tasks, 
  projects, 
  toggleTaskComplete, 
  deleteTask, 
  updateTask,
  addTask,
  setMobileOpen 
}) => {
  const [listeningQ, setListeningQ] = useState(null);

  const handleVoiceInput = (qNum) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listeningQ === qNum) {
      setListeningQ(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'ru-RU';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListeningQ(qNum);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) {
        const inputEl = document.querySelector(`input[name="add-q-${qNum}"]`);
        if (inputEl) {
          inputEl.value = inputEl.value ? `${inputEl.value} ${text}` : text;
        }
      }
    };

    recognition.onerror = () => {
      setListeningQ(null);
    };

    recognition.onend = () => {
      setListeningQ(null);
    };

    recognition.start();
  };
  
  // Helper to categorize tasks into quadrants
  // Q1: High Priority (Urgent & Important)
  // Q2: Medium Priority (Important, Not Urgent)
  // Q3: Low Priority (Urgent, Not Important - has due date but low priority)
  // Q4: None / No Priority & No due date (Neither)
  const getQuadrantTasks = (qNum) => {
    const activeTasks = tasks.filter(t => !t.completed);
    
    switch (qNum) {
      case 1:
        // High priority (Urgent & Important)
        return activeTasks.filter(t => t.priority === 'high');
      case 2:
        // Medium priority (Important but not urgent)
        return activeTasks.filter(t => t.priority === 'medium');
      case 3:
        // Low priority, or has due date but priority is low/none (Urgent but not important)
        return activeTasks.filter(t => 
          (t.priority === 'low') || 
          (t.priority === 'none' && t.dueDate)
        );
      case 4:
      default:
        // No priority and no due date (Neither)
        return activeTasks.filter(t => t.priority === 'none' && !t.dueDate);
    }
  };

  const handleQuickAdd = (qNum, title) => {
    if (!title.trim()) return;

    let priority = 'none';
    let dueDate = null;

    if (qNum === 1) {
      priority = 'high';
      dueDate = new Date().toISOString().split('T')[0]; // Urgent = Today
    } else if (qNum === 2) {
      priority = 'medium'; // Important, not urgent
    } else if (qNum === 3) {
      priority = 'low';
      dueDate = new Date().toISOString().split('T')[0]; // Urgent = Today
    }

    addTask({
      title: title.trim(),
      priority,
      dueDate,
      project: 'inbox'
    });
  };

  const shiftQuadrant = (task, targetQ) => {
    let updates = {};
    if (targetQ === 1) {
      updates = { priority: 'high', dueDate: task.dueDate || new Date().toISOString().split('T')[0] };
    } else if (targetQ === 2) {
      updates = { priority: 'medium', dueDate: null };
    } else if (targetQ === 3) {
      updates = { priority: 'low', dueDate: task.dueDate || new Date().toISOString().split('T')[0] };
    } else if (targetQ === 4) {
      updates = { priority: 'none', dueDate: null };
    }
    updateTask(task.id, updates);
  };

  const renderQuadrantCard = (qNum, title, description, colorClass) => {
    const qTasks = getQuadrantTasks(qNum);
    
    return (
      <div className={`matrix-quadrant ${colorClass}`}>
        <header className="quadrant-header">
          <div className="quadrant-meta">
            <h4>Q{qNum}: {title}</h4>
            <span className="quadrant-count">{qTasks.length}</span>
          </div>
          <p className="quadrant-desc">{description}</p>
        </header>

        {/* Quadrant Quick Add */}
        <form 
          className="quadrant-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.elements[`add-q-${qNum}`];
            handleQuickAdd(qNum, input.value);
            input.value = '';
          }}
        >
          <Plus size={14} className="add-icon" />
          <input
            name={`add-q-${qNum}`}
            type="text"
            placeholder={listeningQ === qNum ? "Listening... Speak now..." : "Add task to this quadrant..."}
            style={{ flex: 1 }}
          />
          {typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition) && (
            <button
              type="button"
              className={`mic-btn ${listeningQ === qNum ? 'listening' : ''}`}
              onClick={() => handleVoiceInput(qNum)}
              title="Voice Input"
              style={{
                padding: '4px',
                color: listeningQ === qNum ? '#ef4444' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)'
              }}
            >
              <Mic size={14} className={listeningQ === qNum ? 'animate-pulse' : ''} />
            </button>
          )}
        </form>

        {/* Tasks List */}
        <div className="quadrant-tasks-list">
          {qTasks.length === 0 ? (
            <div className="quadrant-empty">No tasks in this quadrant</div>
          ) : (
            qTasks.map(task => {
              const proj = projects.find(p => p.id === task.project);
              return (
                <div key={task.id} className="matrix-task-row">
                  <button 
                    className="task-checkbox"
                    onClick={() => toggleTaskComplete(task.id)}
                  >
                    <Circle size={16} />
                  </button>

                  <div className="task-info">
                    <span className="task-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {task.priority === 'high' && <ChevronsUp size={14} style={{ color: '#ef4444', flexShrink: 0 }} />}
                      {task.priority === 'medium' && <ChevronUp size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                      {task.priority === 'low' && <ChevronDown size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />}
                      <span>{task.title}</span>
                    </span>
                    {proj && (
                      <span className="task-proj" style={{ color: proj.color }}>
                        {proj.name}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar inside cell */}
                  <div className="task-actions">
                    <select 
                      className="shift-select"
                      value={qNum}
                      onChange={(e) => shiftQuadrant(task, parseInt(e.target.value))}
                    >
                      <option value={1}>Move to Q1</option>
                      <option value={2}>Move to Q2</option>
                      <option value={3}>Move to Q3</option>
                      <option value={4}>Move to Q4</option>
                    </select>

                    <button 
                      className="delete-task-btn"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="matrix-view">
      <header className="matrix-header">
        <div className="header-left">
          <button className="mobile-menu-trigger" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <h2>Eisenhower Matrix</h2>
        </div>
        <div className="matrix-legend">
          <HelpCircle size={14} className="legend-icon" />
          <span>Priority Planner: Urgent vs Important</span>
        </div>
      </header>

      <div className="matrix-scroll-container">
        <div className="matrix-grid-2x2">
          <div className="matrix-row">
            {renderQuadrantCard(
              1,
              "Urgent & Important",
              "DO FIRST: Critical deadlines and crises.",
              "q1-card"
            )}
            {renderQuadrantCard(
              2,
              "Important, Not Urgent",
              "SCHEDULE: Strategic planning, long-term goals.",
              "q2-card"
            )}
          </div>
          <div className="matrix-row">
            {renderQuadrantCard(
              3,
              "Urgent, Not Important",
              "DELEGATE/LIMIT: Meetings, daily requests, admin.",
              "q3-card"
            )}
            {renderQuadrantCard(
              4,
              "Neither (Eliminate)",
              "DROP: Time-wasters, trivia, low-value work.",
              "q4-card"
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
