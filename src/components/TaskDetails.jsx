import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Flag, 
  Folder, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square,
  Tag
} from 'lucide-react';
import './TaskDetails.css';

const TaskDetails = ({ 
  task, 
  projects, 
  onUpdateTask, 
  onClose 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('none');
  const [dueDate, setDueDate] = useState('');
  const [project, setProject] = useState('inbox');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTag, setNewTag] = useState('');

  // Sync state with selected task
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'none');
      setDueDate(task.dueDate || '');
      setProject(task.project || 'inbox');
    }
  }, [task]);

  if (!task) return null;

  // Auto-save helpers
  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== task.title) {
      onUpdateTask(task.id, { title: title.trim() });
    } else {
      setTitle(task.title); // Reset to original if empty
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      onUpdateTask(task.id, { description });
    }
  };

  const handlePriorityChange = (e) => {
    const val = e.target.value;
    setPriority(val);
    onUpdateTask(task.id, { priority: val });
  };

  const handleDueDateChange = (e) => {
    const val = e.target.value;
    setDueDate(val);
    onUpdateTask(task.id, { dueDate: val || null });
  };

  const handleProjectChange = (e) => {
    const val = e.target.value;
    setProject(val);
    onUpdateTask(task.id, { project: val });
  };

  // Checklist actions
  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;

    const newItem = {
      id: `chk-${Date.now()}`,
      title: newChecklistItem.trim(),
      completed: false
    };

    const updatedChecklist = [...(task.checklist || []), newItem];
    onUpdateTask(task.id, { checklist: updatedChecklist });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (itemId) => {
    const updatedChecklist = (task.checklist || []).map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateTask(task.id, { checklist: updatedChecklist });
  };

  const deleteChecklistItem = (itemId) => {
    const updatedChecklist = (task.checklist || []).filter(item => item.id !== itemId);
    onUpdateTask(task.id, { checklist: updatedChecklist });
  };

  // Tag actions
  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const cleanedTag = newTag.trim();
    if (task.tags && task.tags.includes(cleanedTag)) return;

    const updatedTags = [...(task.tags || []), cleanedTag];
    onUpdateTask(task.id, { tags: updatedTags });
    setNewTag('');
  };

  const deleteTag = (tagToDelete) => {
    const updatedTags = (task.tags || []).filter(t => t !== tagToDelete);
    onUpdateTask(task.id, { tags: updatedTags });
  };

  return (
    <>
      <div className="task-details-overlay" onClick={onClose}></div>
      <div className="task-details-panel">
        <header className="panel-header">
          <span className="panel-meta-title">Task Details</span>
          <button className="close-panel-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="panel-content">
          {/* Title input */}
          <input
            type="text"
            className="task-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Untitled Task"
          />

          {/* Properties grid */}
          <div className="properties-grid">
            <div className="property-row">
              <span className="property-label">
                <Folder size={14} /> Project
              </span>
              <select 
                className="property-value-select" 
                value={project}
                onChange={handleProjectChange}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="property-row">
              <span className="property-label">
                <Calendar size={14} /> Due Date
              </span>
              <input
                type="date"
                className="property-value-date"
                value={dueDate}
                onChange={handleDueDateChange}
              />
            </div>

            <div className="property-row">
              <span className="property-label">
                <Flag size={14} /> Priority
              </span>
              <select 
                className="property-value-select" 
                value={priority}
                onChange={handlePriorityChange}
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="section-container">
            <h4 className="section-heading">Description</h4>
            <textarea
              className="task-desc-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add detailed task description here..."
            />
          </div>

          {/* Checklist subtasks */}
          <div className="section-container">
            <h4 className="section-heading">Checklist</h4>
            <div className="checklist-list">
              {(task.checklist || []).map(item => (
                <div key={item.id} className="checklist-item-row">
                  <button 
                    className="checklist-chk-btn" 
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    {item.completed ? (
                      <CheckSquare size={16} className="checked-icon" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                  <span className={`checklist-item-text ${item.completed ? 'completed' : ''}`}>
                    {item.title}
                  </span>
                  <button 
                    className="checklist-del-btn" 
                    onClick={() => deleteChecklistItem(item.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklist} className="add-checklist-form">
              <input
                type="text"
                placeholder="Add subtask..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
              />
              <button type="submit" disabled={!newChecklistItem.trim()}>
                <Plus size={14} />
              </button>
            </form>
          </div>

          {/* Tags */}
          <div className="section-container">
            <h4 className="section-heading">Tags</h4>
            <div className="tags-container">
              {(task.tags || []).map(tag => (
                <span key={tag} className="tag-pill">
                  {tag}
                  <button onClick={() => deleteTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddTag} className="add-tag-form">
              <Tag size={12} className="tag-input-icon" />
              <input
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <button type="submit" disabled={!newTag.trim()}>
                <Plus size={12} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetails;
