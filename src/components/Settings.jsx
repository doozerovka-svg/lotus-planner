import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Eye, 
  EyeOff, 
  Key, 
  Moon, 
  Sun, 
  Trash2, 
  Check, 
  HelpCircle,
  Menu
} from 'lucide-react';
import { getSettings, saveSettings, resetDb } from '../utils/db';
import './Settings.css';

const Settings = ({ setMobileOpen }) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [theme, setTheme] = useState('dark');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('http://localhost:11434/v1');

  // Load settings on mount
  useEffect(() => {
    const setts = getSettings();
    setApiKey(setts.apiKey || '');
    setProvider(setts.provider || 'openai');
    setModel(setts.model || 'gpt-4o-mini');
    setTheme(setts.theme || 'dark');
    setCustomEndpoint(setts.customEndpoint || 'http://localhost:11434/v1');
  }, []);

  // Sync available models based on selected provider
  const getModelsForProvider = (prov) => {
    switch (prov) {
      case 'openai':
        return [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)' },
          { id: 'gpt-4o', name: 'GPT-4o (Smart & Detailed)' }
        ];
      case 'anthropic':
        return [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' }
        ];
      case 'gemini':
        return [
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
        ];
      case 'local':
        return [
          { id: 'gemma2', name: 'Gemma 2 (Recommended)' },
          { id: 'gemma:2b', name: 'Gemma 2B (Lightweight)' },
          { id: 'llama3', name: 'Llama 3' },
          { id: 'mistral', name: 'Mistral' }
        ];
      case 'windowAI':
        return [
          { id: 'window-ai', name: 'Chrome built-in Gemini Nano' }
        ];
      default:
        return [];
    }
  };

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    // Auto-select first model for new provider
    const models = getModelsForProvider(newProvider);
    if (models.length > 0) {
      setModel(models[0].id);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings({
      apiKey: apiKey.trim(),
      provider,
      model,
      theme,
      customEndpoint: customEndpoint.trim()
    });

    // Read back healed settings to refresh UI state
    const healed = getSettings();
    setApiKey(healed.apiKey || '');

    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', theme);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleThemeToggle = (selectedTheme) => {
    setTheme(selectedTheme);
    document.documentElement.setAttribute('data-theme', selectedTheme);
    saveSettings({
      apiKey: apiKey.trim(),
      provider,
      model,
      theme: selectedTheme,
      customEndpoint: customEndpoint.trim()
    });
  };

  const handleReset = () => {
    if (confirm('Are you absolutely sure you want to reset the database? All your tasks, projects, settings, and Lotus grids will be permanently deleted!')) {
      resetDb();
      window.location.reload();
    }
  };

  const modelsList = getModelsForProvider(provider);

  return (
    <div className="settings-view">
      <header className="settings-header">
        <div className="header-left">
          <button type="button" className="mobile-menu-trigger" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <SettingsIcon size={20} className="logo-icon" />
          <h2>Settings</h2>
        </div>
      </header>

      <div className="settings-scroll-container">
        <form onSubmit={handleSave} className="settings-form">
          
          {/* Theme card */}
          <div className="settings-card">
            <h4>Appearance</h4>
            <p className="card-desc">Choose your preferred visual theme.</p>
            <div className="theme-toggle-grid">
              <button 
                type="button"
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeToggle('dark')}
              >
                <Moon size={18} />
                <span>Dark Mode</span>
              </button>
              <button 
                type="button"
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeToggle('light')}
              >
                <Sun size={18} />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* AI Settings Card */}
          <div className="settings-card">
            <h4>AI API Key & Models</h4>
            <p className="card-desc">
              Lotus Blossom AI runs completely client-side in your browser. Configure your own API key to perform strategic task decompositions.
            </p>

            <div className="settings-group">
              <label htmlFor="provider">API Provider</label>
              <select 
                id="provider"
                value={provider}
                onChange={handleProviderChange}
              >
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
                <option value="local">Local API (Ollama, LM Studio)</option>
                <option value="windowAI">Chrome built-in AI (Gemini Nano)</option>
              </select>
            </div>

            <div className="settings-group">
              <label htmlFor="model">Model</label>
              <select 
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {modelsList.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="settings-group">
              <label htmlFor="key">API Key { (provider === 'local' || provider === 'windowAI') && '(Optional)' }</label>
              <div className="api-key-input-wrapper">
                <Key size={14} className="key-icon" />
                <input
                  id="key"
                  type={showKey ? 'text' : 'password'}
                  placeholder={provider === 'local' || provider === 'windowAI' ? 'Optional for local AI' : `Enter your ${provider.toUpperCase()} API key...`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={provider === 'windowAI'}
                />
                <button 
                  type="button" 
                  className="show-key-btn"
                  onClick={() => setShowKey(!showKey)}
                  disabled={provider === 'windowAI'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="api-key-help">
                <HelpCircle size={10} />
                Keys are stored only in your local browser storage.
              </span>
            </div>

            {provider === 'local' && (
              <div className="settings-group">
                <label htmlFor="customEndpoint">Local Base URL</label>
                <input
                  id="customEndpoint"
                  type="text"
                  placeholder="e.g. http://localhost:11434/v1"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                />
                <span className="api-key-help">
                  <HelpCircle size={10} />
                  Ollama default is http://localhost:11434/v1. LM Studio is http://localhost:1234/v1.
                </span>
              </div>
            )}

            {provider === 'windowAI' && (
              <div className="settings-group" style={{ backgroundColor: 'var(--bg-sidebar)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>How to enable Chrome built-in Gemini Nano:</p>
                <ol style={{ marginLeft: '16px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Open Chrome and go to: <code>chrome://flags/#optimization-guide-on-device-model</code></li>
                  <li>Set it to <strong>Enabled BypassPrefRequiredLimit</strong></li>
                  <li>Go to: <code>chrome://flags/#prompt-api-for-gemini-nano</code> and set to <strong>Enabled</strong></li>
                  <li>Relaunch Chrome and let it download the model (check <code>chrome://components</code> "Optimization Guide On Device Model").</li>
                </ol>
              </div>
            )}

            <button type="submit" className="save-settings-btn">
              {savedSuccess ? (
                <>
                  <Check size={16} /> Saved Successfully
                </>
              ) : (
                'Save API Configuration'
              )}
            </button>
          </div>

          {/* Danger zone */}
          <div className="settings-card danger-card">
            <h4 className="danger-text">Danger Zone</h4>
            <p className="card-desc">Permanently wipe your app data and restore defaults.</p>
            
            <button 
              type="button" 
              className="reset-db-btn"
              onClick={handleReset}
            >
              <Trash2 size={14} />
              Reset All Planner Data
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
