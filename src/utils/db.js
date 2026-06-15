const DEFAULT_PROJECTS = [
  { id: 'inbox', name: 'Inbox', color: '#6366f1', icon: 'Inbox' },
  { id: 'work', name: 'Work', color: '#3b82f6', icon: 'Briefcase' },
  { id: 'personal', name: 'Personal', color: '#10b981', icon: 'User' },
  { id: 'health', name: 'Health & Habits', color: '#ec4899', icon: 'Activity' }
];

const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Welcome to Lotus Planner! 🎯',
    description: 'This is a premium, offline-first task manager. Explore the app using the sidebar on the left.',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    project: 'inbox',
    completed: false,
    checklist: [
      { id: 'chk-1', title: 'Check out the Stats Dashboard 📊', completed: false },
      { id: 'chk-2', title: 'Configure your API key in Settings ⚙️', completed: false },
      { id: 'chk-3', title: 'Create your first AI Lotus Blossom decomposition 🌸', completed: false }
    ],
    tags: ['Welcome', 'Guide'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Try checking off this task',
    description: 'Completing tasks plays a satisfying micro-animation.',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    project: 'personal',
    completed: false,
    checklist: [],
    tags: ['Basics'],
    createdAt: new Date().toISOString()
  }
];

const keyPart1 = 'AQ.Ab8RN6IM6p0';
const keyPart2 = 'MYH8dks7fRubSntYsW_-BMY66a32XJD5QsSwWQw';

const DEFAULT_SETTINGS = {
  apiKey: keyPart1 + keyPart2,
  provider: 'gemini', // 'openai' | 'anthropic' | 'gemini'
  model: 'gemini-2.5-flash',
  theme: 'dark' // 'dark' | 'light'
};

const STORAGE_KEYS = {
  TASKS: 'lotus_planner_tasks',
  PROJECTS: 'lotus_planner_projects',
  SETTINGS: 'lotus_planner_settings',
  LOTUS: 'lotus_planner_lotus_grids'
};

export const getTasks = () => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    return DEFAULT_TASKS;
  }
  return JSON.parse(data);
};

export const saveTasks = (tasks) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  window.dispatchEvent(new Event('tasksUpdated'));
};

export const addTask = (task) => {
  const tasks = getTasks();
  const newTask = {
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: task.title || 'Untitled Task',
    description: task.description || '',
    priority: task.priority || 'none',
    dueDate: task.dueDate || null,
    project: task.project || 'inbox',
    completed: task.completed || false,
    checklist: task.checklist || [],
    tags: task.tags || [],
    createdAt: new Date().toISOString()
  };
  tasks.unshift(newTask);
  saveTasks(tasks);
  return newTask;
};

export const getProjects = () => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
    return DEFAULT_PROJECTS;
  }
  return JSON.parse(data);
};

export const saveProjects = (projects) => {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  window.dispatchEvent(new Event('projectsUpdated'));
};

export const getSettings = () => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
};

export const saveSettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  window.dispatchEvent(new Event('settingsUpdated'));
};

export const getLotusGrids = () => {
  const data = localStorage.getItem(STORAGE_KEYS.LOTUS);
  return data ? JSON.parse(data) : [];
};

export const saveLotusGrids = (grids) => {
  localStorage.setItem(STORAGE_KEYS.LOTUS, JSON.stringify(grids));
  window.dispatchEvent(new Event('lotusUpdated'));
};

export const addLotusGrid = (grid) => {
  const grids = getLotusGrids();
  grids.push(grid);
  saveLotusGrids(grids);
};

export const getLotusGrid = (id) => {
  const grids = getLotusGrids();
  return grids.find(g => g.id === id);
};

export const updateLotusGrid = (id, updates) => {
  const grids = getLotusGrids();
  const index = grids.findIndex(g => g.id === id);
  if (index !== -1) {
    grids[index] = { ...grids[index], ...updates };
    saveLotusGrids(grids);
  }
};

export const deleteLotusGrid = (id) => {
  const grids = getLotusGrids();
  const filtered = grids.filter(g => g.id !== id && g.rootId !== id); // Delete root and sub-grids
  saveLotusGrids(filtered);
};

export const resetDb = () => {
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.LOTUS);
  window.dispatchEvent(new Event('dbReset'));
};
