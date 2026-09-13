import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NovaLogo from '../branding/NovaLogo';

/**
 * TopBar Component (Refined SaaS Scale)
 * Displays search trigger (with Ctrl+K shortcut), dynamic Firebase user avatar & name,
 * mobile brand logo, hamburger menu trigger, and profile dropdown.
 */
export default function TopBar({ onToggleSidebar, onOpenAuthModal, onOpenSearch }) {
  const { user, isAuthenticated, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const userName = user?.name || 'Guest User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="nova-topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Open navigation menu">
          <span className="hamburger-icon">≡</span>
        </button>
        <div className="mobile-topbar-brand">
          <NovaLogo size={28} showText={true} />
        </div>
      </div>

      <div className="topbar-right">
        {/* Search Trigger Button */}
        <button 
          className="topbar-icon-btn" 
          onClick={onOpenSearch}
          title="Search conversations (Ctrl+K)"
          aria-label="Search conversations"
        >
          <Search size={16} />
        </button>

        {/* Dynamic Firebase User Profile Badge OR Sign In Button */}
        {isAuthenticated ? (
          <div className="profile-dropdown-container" ref={dropdownRef}>
            <div 
              className="user-profile-badge"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="User Profile Options"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={userName} className="user-avatar-img" referrerPolicy="no-referrer" />
              ) : (
                <div className="user-avatar-circle">{userInitial}</div>
              )}
              <span className="user-name">{userName}</span>
              <ChevronDown size={13} style={{ opacity: 0.6 }} />
            </div>

            {dropdownOpen && (
              <div className="profile-menu-dropdown">
                <div className="profile-dropdown-header">
                  <div className="dropdown-user-name">{userName}</div>
                  <div className="dropdown-user-email">{user?.email || ''}</div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-menu-item" onClick={() => setDropdownOpen(false)}>
                  <Settings size={15} />
                  <span>Settings</span>
                </button>
                <button className="dropdown-menu-item logout" onClick={handleSignOut}>
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn-topbar-signin"
            onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
            title="Sign In or Create Account"
          >
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
