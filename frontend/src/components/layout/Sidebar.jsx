import React, { useState, useRef, useEffect } from 'react';
import NovaLogo from '../branding/NovaLogo';
import { 
  MessageSquare, 
  Compass, 
  LayoutGrid, 
  Folder, 
  Settings, 
  Plus, 
  Search,
  MessageCircle,
  MoreHorizontal,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

/**
 * Sidebar Component (Compact SaaS Scale)
 * Width: 270px, 52px New Chat button, 48px nav items, clean bottom section.
 * Renders Recent Chats with three-dot options menu (Rename & Delete).
 */
export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  activeTab = 'chat',
  onSelectTab,
  recentChats = [],
  isChatsLoading = false,
  activeChatId,
  onSelectChat,
  onOpenRenameModal,
  onOpenDeleteModal,
  onOpenSearch,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuChatId, setOpenMenuChatId] = useState(null);
  const menuRef = useRef(null);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'templates', label: 'Templates', icon: LayoutGrid },
    { id: 'library', label: 'Library', icon: Folder },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Close context menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuChatId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredChats = recentChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectNav = (tabId) => {
    onSelectTab(tabId);
    if (onClose) onClose();
  };

  const handleNewChatClick = () => {
    onNewChat();
    if (onClose) onClose();
  };

  const handleSelectChatClick = (chatId) => {
    if (onSelectChat) onSelectChat(chatId);
    if (onClose) onClose();
  };

  const handleSearchClick = () => {
    if (onOpenSearch) onOpenSearch();
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`nova-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header with Canonical NOVA Emblem */}
        <div className="sidebar-header">
          <NovaLogo size={54} showText={true} />
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* + New Chat Button (52px height) */}
        <div className="new-chat-container">
          <button className="btn-new-chat" onClick={handleNewChatClick}>
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Main Navigation (48px height) */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectNav(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Recent Chats Section */}
        <div className="recent-chats-section" ref={menuRef}>
          <div className="recent-header">
            <span>Recent Chats</span>
            <button
              className="icon-btn-subtle"
              title="Search history"
              aria-label="Search history"
              onClick={handleSearchClick}
            >
              <Search size={13} />
            </button>
          </div>

          <div className="recent-list">
            {isChatsLoading ? (
              <div className="recent-empty-placeholder">
                <div className="sidebar-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading chats...</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="recent-empty-placeholder">
                <span>No conversations yet</span>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`recent-item ${activeChatId === chat.id ? 'selected' : ''}`}
                  onClick={() => handleSelectChatClick(chat.id)}
                >
                  <MessageCircle size={14} className="chat-item-icon" />
                  <div className="recent-info">
                    <div className="recent-title">{chat.title}</div>
                  </div>

                  {/* Three-dot Options Trigger */}
                  <div className="recent-item-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`btn-chat-options ${openMenuChatId === chat.id ? 'active' : ''}`}
                      onClick={() => setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id)}
                      title="Conversation options"
                      aria-label="Conversation options"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {/* Options Context Menu */}
                    {openMenuChatId === chat.id && (
                      <div className="chat-options-menu">
                        <button
                          className="chat-menu-option"
                          onClick={() => {
                            setOpenMenuChatId(null);
                            if (onOpenRenameModal) onOpenRenameModal(chat);
                          }}
                        >
                          <Edit2 size={13} />
                          <span>Rename</span>
                        </button>
                        <button
                          className="chat-menu-option delete-option"
                          onClick={() => {
                            setOpenMenuChatId(null);
                            if (onOpenDeleteModal) onOpenDeleteModal(chat);
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
