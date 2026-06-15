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
  HelpCircle 
} from 'lucide-react';
import { getSettings, saveSettings, resetDb } from '../utils/db';
import './Settings.css';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [theme, setTheme] = useState('dark');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const setts = getSettings();
    setApiKey(setts.apiKey || '');
    setProvider(setts.provider || 'openai');
    setModel(setts.model || 'gpt-4o-mini');
    setTheme(setts.theme || 'dark');
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
      theme
    });

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
      theme: selectedTheme
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
              <label htmlFor="key">API Key</label>
              <div className="api-key-input-wrapper">
                <Key size={14} className="key-icon" />
                <input
                  id="key"
                  type={showKey ? 'text' : 'password'}
                  placeholder={`Enter your ${provider.toUpperCase()} API key...`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button 
                  type="button" 
                  className="show-key-btn"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="api-key-help">
                <HelpCircle size={10} />
                Keys are stored only in your local browser storage.
              </span>
            </div>

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
