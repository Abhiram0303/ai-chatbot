import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Loader2, X } from 'lucide-react';

/**
 * RenameChatModal Component
 * Allows user to rename a conversation in the Recent Chats sidebar.
 */
export default function RenameChatModal({
  isOpen,
  initialTitle = '',
  onClose,
  onConfirm,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setError('');
      setLoading(false);
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = (initialTitle || '').length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a conversation title.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onConfirm(title.trim());
      setLoading(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to rename chat. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="nova-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="nova-modal-card delete-modal-card">
        <button
          className="nova-modal-close-btn"
          onClick={onClose}
          disabled={loading}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="delete-modal-header">
          <div className="delete-modal-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.28)' }}>
            <Edit2 size={20} style={{ color: '#38bdf8' }} />
          </div>
          <h2 className="delete-modal-title">Rename chat</h2>
          <p className="delete-modal-subtitle">Enter a new name for this conversation.</p>
        </div>

        {error && (
          <div className="auth-error-banner" style={{ marginTop: '12px' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="input-wrapper" style={{ marginBottom: '20px' }}>
            <input
              ref={inputRef}
              type="text"
              className="form-input rename-chat-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="delete-modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-auth-primary"
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem' }}
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
