import React, { useState } from 'react';
import { 
  User, 
  Sliders, 
  Sun, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  Check, 
  Edit3, 
  Save,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * SettingsScreen Component
 * Manages Account profile, Model preferences, Appearance theme, Data & Privacy, and Support.
 */
export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [theme, setTheme] = useState(() => localStorage.getItem('nova_theme') || 'dark');
  const [defaultModel, setDefaultModel] = useState('Gemini 3.8 Flash');
  const [enterToSend, setEnterToSend] = useState(true);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'privacy', label: 'Data & Privacy', icon: ShieldCheck },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('nova_theme', newTheme);
  };

  const userName = user?.name || 'Guest User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="nova-workspace-body settings-page-container">
      {/* Header */}
      <div className="settings-header">
        <div className="explore-badge">
          <Sparkles size={14} style={{ color: '#38bdf8' }} />
          <span>PREFERENCES & SYSTEM</span>
        </div>
        <h1 className="explore-title">Settings</h1>
        <p className="explore-subtitle">Manage your account credentials, AI preferences and theme</p>
      </div>

      {/* Settings Layout */}
      <div className="settings-layout">
        {/* Section Navigation Tabs */}
        <div className="settings-sidebar">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                className={`settings-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(sec.id)}
              >
                <Icon size={16} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content Panel */}
        <div className="settings-content">
          {/* ACCOUNT SECTION */}
          {activeTab === 'account' && (
            <div className="settings-panel">
              <h2 className="settings-panel-title">Account Profile</h2>
              <p className="settings-panel-subtitle">Your personal identity and connected Firebase authentication providers.</p>

              <div className="settings-card">
                <div className="settings-profile-header">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={userName} className="settings-avatar-img" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="user-avatar-circle" style={{ width: 52, height: 52, fontSize: 20 }}>
                      {userInitial}
                    </div>
                  )}

                  <div className="settings-profile-info">
                    {isEditingName ? (
                      <div className="edit-name-group">
                        <input
                          type="text"
                          className="form-input"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                        />
                        <button
                          className="btn-auth-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => setIsEditingName(false)}
                        >
                          <Save size={13} />
                          <span>Save</span>
                        </button>
                      </div>
                    ) : (
                      <div className="profile-name-row">
                        <h3>{userName}</h3>
                        <button
                          className="icon-btn-subtle"
                          onClick={() => {
                            setNameInput(userName);
                            setIsEditingName(true);
                          }}
                          title="Edit name"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    )}
                    <p className="profile-email-text">{user?.email || 'Not signed in'}</p>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-row">
                  <div>
                    <span className="settings-label">Authentication Provider</span>
                    <p className="settings-desc">Connected login methods for your NOVA account.</p>
                  </div>
                  <div className="provider-badges">
                    <span className="provider-badge">
                      <Check size={12} style={{ color: '#10b981' }} />
                      <span>{user?.email ? 'Firebase Auth' : 'Guest'}</span>
                    </span>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-row">
                  <div>
                    <span className="settings-label">Sign Out</span>
                    <p className="settings-desc">End your active Firebase session on this device.</p>
                  </div>
                  <button className="btn-modal-cancel" style={{ width: 'auto' }} onClick={signOut}>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES SECTION */}
          {activeTab === 'preferences' && (
            <div className="settings-panel">
              <h2 className="settings-panel-title">AI Model Preferences</h2>
              <p className="settings-panel-subtitle">Configure default AI model engines and input shortcuts.</p>

              <div className="settings-card">
                <div className="settings-row">
                  <div>
                    <span className="settings-label">Default AI Model</span>
                    <p className="settings-desc">Primary intelligence engine for new conversations.</p>
                  </div>
                  <select
                    className="form-input"
                    style={{ width: 180, fontSize: '0.82rem' }}
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                  >
                    <option value="Gemini 3.8 Flash">Gemini 3.8 Flash</option>
                    <option value="Gemini 3.5 Pro">Gemini 3.5 Pro</option>
                  </select>
                </div>

                <div className="settings-divider" />

                <div className="settings-row">
                  <div>
                    <span className="settings-label">Press Enter to Send</span>
                    <p className="settings-desc">Submit message immediately when pressing Enter key.</p>
                  </div>
                  <button
                    className={`toggle-switch ${enterToSend ? 'active' : ''}`}
                    onClick={() => setEnterToSend(!enterToSend)}
                  >
                    <div className="toggle-slider" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {activeTab === 'appearance' && (
            <div className="settings-panel">
              <h2 className="settings-panel-title">Appearance & Theme</h2>
              <p className="settings-panel-subtitle">Select your preferred color scheme and UI aesthetic.</p>

              <div className="settings-card">
                <div className="theme-options-grid">
                  <div
                    className={`theme-card ${theme === 'dark' ? 'selected' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <div className="theme-preview dark-preview" />
                    <span>Dark (Default)</span>
                  </div>
                  <div
                    className={`theme-card ${theme === 'system' ? 'selected' : ''}`}
                    onClick={() => handleThemeChange('system')}
                  >
                    <div className="theme-preview system-preview" />
                    <span>System Theme</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY SECTION */}
          {activeTab === 'privacy' && (
            <div className="settings-panel">
              <h2 className="settings-panel-title">Data & Privacy</h2>
              <p className="settings-panel-subtitle">Review your data protection and cloud database status.</p>

              <div className="settings-card">
                <div className="settings-row">
                  <div>
                    <span className="settings-label">Cloud Firestore Isolation</span>
                    <p className="settings-desc">All user conversations and file metadata are strictly isolated under users/&#123;uid&#125;.</p>
                  </div>
                  <span className="provider-badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <Check size={12} />
                    <span>Secured</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SUPPORT SECTION */}
          {activeTab === 'support' && (
            <div className="settings-panel">
              <h2 className="settings-panel-title">Support & About</h2>
              <p className="settings-panel-subtitle">System version and help resources for NOVA AI Assistant.</p>

              <div className="settings-card">
                <div className="settings-row">
                  <div>
                    <span className="settings-label">NOVA AI Assistant</span>
                    <p className="settings-desc">Version 2.0.0 (Production Build)</p>
                  </div>
                  <div className="model-selector-pill">
                    <Zap size={12} style={{ color: '#38bdf8' }} />
                    <span>v2.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
