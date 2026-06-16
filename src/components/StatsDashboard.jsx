import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  FolderOpen,
  Menu
} from 'lucide-react';
import { getTasks, getProjects } from '../utils/db';
import './StatsDashboard.css';

const StatsDashboard = ({ setMobileOpen }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setTasks(getTasks());
    setProjects(getProjects());

    const handleUpdate = () => {
      setTasks(getTasks());
      setProjects(getProjects());
    };
    window.addEventListener('tasksUpdated', handleUpdate);
    window.addEventListener('projectsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('tasksUpdated', handleUpdate);
      window.removeEventListener('projectsUpdated', handleUpdate);
    };
  }, []);

  // Compute metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriorityCount = tasks.filter(t => !t.completed && t.priority === 'high').length;
  
  // Tasks completed today
  const todayStr = new Date().toISOString().split('T')[0];
  const completedTodayCount = tasks.filter(t => t.completed && t.dueDate === todayStr).length;

  // Projects distribution
  const projectStats = projects.map(proj => {
    const projTasks = tasks.filter(t => t.project === proj.id);
    const totalProj = projTasks.length;
    const completedProj = projTasks.filter(t => t.completed).length;
    const rate = totalProj > 0 ? Math.round((completedProj / totalProj) * 100) : 0;
    return {
      ...proj,
      total: totalProj,
      completed: completedProj,
      rate
    };
  });

  // Calculate SVG stroke properties for circular progress
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Karma Rank calculations
  const karmaPoints = (completedTasks * 10) + (tasks.filter(t => t.completed && t.tags.includes('Lotus Blossom')).length * 20);
  
  const getRank = (points) => {
    if (points >= 1000) return { name: 'Zen Planner 🧘‍♂️', next: 'Max Level', cap: 1000, req: 1000 };
    if (points >= 500) return { name: 'Focus Master ⚡', next: 'Zen Planner 🧘‍♂️', cap: 1000, req: 500 };
    if (points >= 200) return { name: 'Blooming Bud 🌸', next: 'Focus Master ⚡', cap: 500, req: 200 };
    if (points >= 50) return { name: 'Rising Sprout 🌱', next: 'Blooming Bud 🌸', cap: 200, req: 50 };
    return { name: 'Lotus Seedling 🌰', next: 'Rising Sprout 🌱', cap: 50, req: 0 };
  };

  const rank = getRank(karmaPoints);
  const rankProgress = rank.next === 'Max Level' ? 100 : Math.round(((karmaPoints - rank.req) / (rank.cap - rank.req)) * 100);

  // Mock past 7 days completion for vertical bar chart
  const getPast7Days = () => {
    const days = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = tasks.filter(t => t.completed && t.dueDate === dateStr).length;
      
      days.push({
        label: weekdayNames[d.getDay()],
        count: count,
        date: dateStr
      });
    }
    return days;
  };

  const weeklyHistory = getPast7Days();
  const maxWeeklyCount = Math.max(...weeklyHistory.map(h => h.count), 4); // Min ceiling of 4 for scale

  return (
    <div className="stats-view">
      <header className="stats-header">
        <div className="header-left">
          <button type="button" className="mobile-menu-trigger" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <BarChart3 size={20} className="logo-icon" />
          <h2>Performance Stats</h2>
        </div>
      </header>

      <div className="stats-scroll-container">
        {/* Karma Progress Card */}
        <div className="karma-rank-card">
          <div className="karma-header">
            <div className="karma-title-wrapper">
              <span className="rank-emoji">🏆</span>
              <div>
                <h4>Productivity Level: {rank.name}</h4>
                <p className="rank-points">{karmaPoints} Karma Points</p>
              </div>
            </div>
            <span className="streak-badge">🔥 {completedTodayCount > 0 ? 'Active Streak!' : 'Complete a task today!'}</span>
          </div>
          <div className="karma-progress-track">
            <div className="karma-progress-bar" style={{ width: `${rankProgress}%` }}></div>
          </div>
          <div className="karma-footer">
            <span>Progress to {rank.next}: {rankProgress}%</span>
            <span>{karmaPoints} / {rank.cap} pts</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-wrapper check">
              <CheckCircle size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Completed Tasks</span>
              <h3 className="kpi-val">{completedTasks}</h3>
              <span className="kpi-desc">Total resolved items</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper pending">
              <Clock size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Pending Tasks</span>
              <h3 className="kpi-val">{pendingTasks}</h3>
              <span className="kpi-desc">Remaining in backlog</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper urgent">
              <AlertTriangle size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">High Priority Load</span>
              <h3 className="kpi-val">{highPriorityCount}</h3>
              <span className="kpi-desc">Uncompleted critical tasks</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper streak">
              <TrendingUp size={20} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Completed Today</span>
              <h3 className="kpi-val">{completedTodayCount}</h3>
              <span className="kpi-desc">Due and completed today</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-flexbox">
          {/* Progress Ring Card */}
          <div className="stats-chart-card ring-card">
            <h4>Overall Progress</h4>
            <div className="ring-container">
              <svg className="progress-ring-svg" width="140" height="140">
                <circle
                  className="progress-ring-bg"
                  stroke="var(--border-color)"
                  strokeWidth="8"
                  fill="transparent"
                  r={radius}
                  cx="70"
                  cy="70"
                />
                <circle
                  className="progress-ring-fill"
                  stroke="var(--accent-color)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  r={radius}
                  cx="70"
                  cy="70"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset
                  }}
                />
              </svg>
              <div className="ring-inner-text">
                <span className="percent-num">{completionRate}%</span>
                <span className="percent-label">Done</span>
              </div>
            </div>
            <p className="ring-caption">
              You have completed {completedTasks} out of {totalTasks} total tasks.
            </p>
          </div>

          {/* Bar Chart Card */}
          <div className="stats-chart-card bar-card">
            <h4>Daily Completed Tasks (Past 7 Days)</h4>
            <div className="bar-chart-container">
              <div className="y-axis-labels">
                <span>{maxWeeklyCount}</span>
                <span>{Math.round(maxWeeklyCount / 2)}</span>
                <span>0</span>
              </div>
              <div className="bars-wrapper">
                {weeklyHistory.map((day, idx) => {
                  const heightPercent = (day.count / maxWeeklyCount) * 100;
                  return (
                    <div key={idx} className="bar-column">
                      <div className="bar-tooltip">{day.count} completed</div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        ></div>
                      </div>
                      <span className="bar-label">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Project Breakdown */}
        <div className="project-breakdown-card">
          <div className="card-header">
            <FolderOpen size={18} className="logo-icon" />
            <h4>Task Breakdown by Project</h4>
          </div>

          <div className="project-stats-list">
            {projectStats.map(stat => (
              <div key={stat.id} className="project-stat-row">
                <div className="proj-info">
                  <span className="proj-dot" style={{ backgroundColor: stat.color }}></span>
                  <span className="proj-name">{stat.name}</span>
                  <span className="proj-count">{stat.completed} / {stat.total} tasks</span>
                </div>
                <div className="proj-progress-track">
                  <div 
                    className="proj-progress-bar" 
                    style={{ 
                      width: `${stat.rate}%`, 
                      backgroundColor: stat.color 
                    }}
                  ></div>
                </div>
                <span className="proj-rate-label">{stat.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
