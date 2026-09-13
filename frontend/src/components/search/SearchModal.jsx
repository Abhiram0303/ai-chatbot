import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MessageSquare, X, ArrowRight, Clock, CornerDownLeft } from 'lucide-react';

/**
 * Formats a Date object or timestamp into a friendly human label
 */
function formatChatDate(dateVal) {
  if (!dateVal) return '';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now - d;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffHours < 48 && (now.getDate() - d.getDate() === 1 || now.getDate() - d.getDate() === -30)) {
    return 'Yesterday';
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * SearchModal Component
 * 
 * Interactive search overlay for browsing and finding user conversations.
 * Supports live dynamic filtering, ranking, keyboard arrow navigation, Enter to open, and Escape to close.
 */
export default function SearchModal({
  isOpen,
  onClose,
  recentChats = [],
  onSelectChat,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Auto-focus input when modal opens; reset query & selected index
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Compute filtered & ranked search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: show recent conversations up to 8
      return recentChats.slice(0, 8);
    }

    // Rank 1: Title starts with query
    const startsWithMatches = [];
    // Rank 2: Title contains query elsewhere
    const containsMatches = [];

    for (const chat of recentChats) {
      const titleLower = (chat.title || '').toLowerCase();
      if (titleLower.startsWith(q)) {
        startsWithMatches.push(chat);
      } else if (titleLower.includes(q)) {
        containsMatches.push(chat);
      }
    }

    return [...startsWithMatches, ...containsMatches];
  }, [query, recentChats]);

  // Reset selectedIndex whenever results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, query]);

  // Keyboard navigation handler (Arrows, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleChoose(results[selectedIndex].id);
      }
    }
  };

  const handleChoose = (chatId) => {
    onClose();
    if (onSelectChat) {
      onSelectChat(chatId);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="nova-search-modal-backdrop"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search conversations"
    >
      <div className="nova-search-modal-card" ref={modalRef} onKeyDown={handleKeyDown}>
        {/* Search Header Row */}
        <div className="search-modal-header">
          <Search size={18} className="search-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search conversations by topic or title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          {query ? (
            <button
              className="search-clear-btn"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <>
              <div className="search-kbd-badge">
                <span>ESC</span>
              </div>
              <button
                className="search-close-mobile-btn"
                onClick={onClose}
                title="Close search"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {/* Search Results / Recents List */}
        <div className="search-modal-body">
          {results.length > 0 ? (
            <div className="search-results-list">
              <div className="search-results-subheading">
                {query ? 'Matching Conversations' : 'Recent Conversations'}
              </div>
              {results.map((chat, idx) => {
                const isSelected = idx === selectedIndex;
                const formattedDate = formatChatDate(chat.updatedAt);

                return (
                  <div
                    key={chat.id}
                    className={`search-result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleChoose(chat.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="search-result-left">
                      <div className="search-item-icon-wrap">
                        <MessageSquare size={15} />
                      </div>
                      <div className="search-item-details">
                        <div className="search-item-title">{chat.title || 'Untitled Conversation'}</div>
                        {formattedDate && (
                          <div className="search-item-meta">
                            <Clock size={11} />
                            <span>{formattedDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="search-result-action">
                      {isSelected ? (
                        <div className="search-enter-badge">
                          <span>Open</span>
                          <CornerDownLeft size={12} />
                        </div>
                      ) : (
                        <ArrowRight size={14} className="search-arrow-subtle" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="search-empty-state">
              <div className="search-empty-icon">
                <Search size={22} />
              </div>
              <h4>{query ? 'No conversations found' : 'No recent conversations'}</h4>
              <p>
                {query
                  ? `We couldn't find any conversations matching "${query}".`
                  : 'Start a conversation to search through your chats.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer with Keyboard Guidance */}
        <div className="search-modal-footer">
          <div className="search-footer-hints">
            <span className="search-hint-pill">
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span className="search-hint-pill">
              <kbd>↵</kbd> Select
            </span>
            <span className="search-hint-pill">
              <kbd>ESC</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
