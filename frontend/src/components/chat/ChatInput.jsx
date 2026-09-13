import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Square, Zap, ChevronDown, Check } from 'lucide-react';
import { AI_MODELS } from '../../services/modelConfig';

/**
 * ChatInput Component (Compact SaaS Scale)
 * 66px composer card height, paperclip attachment button, circular gradient send button,
 * Stop generation button, and real AI model selector dropdown.
 */
export default function ChatInput({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  initialText = '',
  selectedModelId,
  onSelectModel,
}) {
  const [text, setText] = useState(initialText);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const pillRef = useRef(null);

  // Sync initialText when set from Explore or Templates tabs
  useEffect(() => {
    if (initialText) {
      setText(initialText);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialText]);

  // Auto-resize height up to 130px max
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [text]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        pillRef.current && !pillRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isDropdownOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed && !isGenerating) {
      const sentImmediately = onSendMessage(trimmed);
      if (sentImmediately) {
        setText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleModelSelect = (modelId) => {
    onSelectModel(modelId);
    setIsDropdownOpen(false);
  };

  const selectedModel = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0];

  // Group models for the dropdown
  const autoModel = AI_MODELS.find((m) => m.id === 'auto');
  const groupedModels = {};
  AI_MODELS.filter((m) => m.group).forEach((m) => {
    if (!groupedModels[m.group]) groupedModels[m.group] = [];
    groupedModels[m.group].push(m);
  });

  return (
    <div className="composer-wrapper">
      <form onSubmit={handleSubmit} className="nova-composer-card">
        {/* Attachment Button */}
        <button
          type="button"
          className="composer-icon-btn"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip size={17} />
        </button>

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder={isGenerating ? "Nova is generating a response..." : "Message Nova..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          rows={1}
          aria-label="Message Nova"
        />

        {/* Send / Stop Action Button */}
        {isGenerating ? (
          <button
            type="button"
            className="composer-stop-btn"
            onClick={onStopGeneration}
            title="Stop generation"
            aria-label="Stop generation"
          >
            <Square size={13} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            className="composer-send-btn"
            disabled={!text.trim()}
            title="Send message"
            aria-label="Send message"
          >
            <ArrowUp size={17} />
          </button>
        )}
      </form>

      {/* Composer Shortcuts & Model Selector Bar */}
      <div className="composer-meta-bar">
        <div className="composer-shortcuts">
          <span>Press <strong>Enter</strong> to send</span>
          <span className="dot-divider">•</span>
          <span><strong>Shift + Enter</strong> for newline</span>
        </div>

        {/* Real Model Selector Pill + Dropdown */}
        <div className="model-selector-container">
          <div
            ref={pillRef}
            className={`model-selector-pill ${isDropdownOpen ? 'active' : ''}`}
            title="Select AI Model"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsDropdownOpen(!isDropdownOpen); } }}
          >
            <Zap size={12} style={{ color: '#38bdf8' }} />
            <span>{selectedModel.label}</span>
            <ChevronDown size={11} className={`selector-chevron ${isDropdownOpen ? 'open' : ''}`} />
          </div>

          {/* Dropdown Popover */}
          {isDropdownOpen && (
            <div ref={dropdownRef} className="model-dropdown">
              <div className="model-dropdown-header">AI MODEL</div>

              {/* Auto Option */}
              {autoModel && (
                <div
                  className={`model-dropdown-item ${selectedModelId === autoModel.id ? 'selected' : ''}`}
                  onClick={() => handleModelSelect(autoModel.id)}
                >
                  <div className="model-item-check">
                    {selectedModelId === autoModel.id && <Check size={14} />}
                  </div>
                  <div className="model-item-info">
                    <span className="model-item-name">{autoModel.label}</span>
                    <span className="model-item-sub">{autoModel.subtitle}</span>
                  </div>
                </div>
              )}

              {/* Provider Groups */}
              {Object.entries(groupedModels).map(([groupName, models]) => (
                <div key={groupName}>
                  <div className="model-dropdown-divider" />
                  <div className="model-dropdown-group">{groupName}</div>
                  {models.map((m) => (
                    <div
                      key={m.id}
                      className={`model-dropdown-item ${selectedModelId === m.id ? 'selected' : ''}`}
                      onClick={() => handleModelSelect(m.id)}
                    >
                      <div className="model-item-check">
                        {selectedModelId === m.id && <Check size={14} />}
                      </div>
                      <div className="model-item-info">
                        <span className="model-item-name">{m.label}</span>
                        <span className="model-item-sub">{m.subtitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
