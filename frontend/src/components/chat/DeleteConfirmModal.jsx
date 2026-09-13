import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, X } from 'lucide-react';

/**
 * DeleteConfirmModal Component
 *
 * Premium NOVA confirmation dialog before permanently deleting a chat.
 * Prevents accidental deletion, handles async deletion state with loader,
 * and displays inline error messages without browser alert/confirm calls.
 */
export default function DeleteConfirmModal({
  isOpen,
  chatTitle,
  onClose,
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    setError('');
    setLoading(true);
    try {
      await onConfirm();
      setLoading(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete conversation. Please try again.');
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
      aria-labelledby="delete-modal-title"
    >
      <div className="nova-modal-card delete-modal-card">
        {/* Close Button */}
        <button
          className="nova-modal-close-btn"
          onClick={onClose}
          disabled={loading}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="delete-modal-header">
          <div className="delete-modal-icon-badge">
            <Trash2 size={22} className="delete-icon" />
          </div>
          <h2 id="delete-modal-title" className="delete-modal-title">
            Delete chat?
          </h2>
          <p className="delete-modal-subtitle">
            This will permanently delete <strong style={{ color: '#fff' }}>"{chatTitle || 'this conversation'}"</strong> and all of its message history.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="auth-error-banner" style={{ marginTop: '12px' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
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
            type="button"
            className="btn-modal-danger"
            onClick={handleConfirmDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="auth-spinner" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
