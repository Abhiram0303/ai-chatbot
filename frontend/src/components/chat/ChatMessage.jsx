import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, MoreHorizontal, AlertCircle } from 'lucide-react';
import CodeBlock from './CodeBlock';
import NovaLogo from '../branding/NovaLogo';

/**
 * ChatMessage Component
 * Renders user and NOVA assistant chat bubbles with exact visual styling,
 * Markdown syntax highlighting, and action bars.
 */
export default function ChatMessage({ message, onRegenerate, isLastAssistantMessage, isGenerating }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message text:', err);
    }
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'bot'} ${isError ? 'error' : ''}`}>
      <div className={`avatar-container ${isUser ? 'user' : 'bot'}`}>
        {isUser ? (
          <div className="avatar user">
            <User size={16} />
          </div>
        ) : isError ? (
          <div className="avatar error">
            <AlertCircle size={16} />
          </div>
        ) : (
          <div className="avatar bot-nova">
            <NovaLogo size={42} showText={false} />
          </div>
        )}
      </div>

      <div className="message-content-wrapper">
        <div className="message-bubble">
          {isUser ? (
            <div className="user-text">{message.content}</div>
          ) : isError ? (
            <div className="error-text">{message.content}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    const isMultiline = codeText.includes('\n') || Boolean(match);

                    if (isMultiline) {
                      return <CodeBlock language={match ? match[1] : ''} code={codeText} />;
                    }

                    return (
                      <code className="inline-code" {...props}>
                        {children}
                      </code>
                    );
                  },
                  a({ node, children, href, ...props }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    );
                  },
                  table({ node, children, ...props }) {
                    return (
                      <div className="markdown-table-wrapper">
                        <table className="markdown-table" {...props}>
                          {children}
                        </table>
                      </div>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Timestamp & Action Buttons Bar */}
        <div className="message-meta-bar">
          {message.timestamp && <span className="message-time">{message.timestamp}</span>}

          {!isUser && !isError && message.content && (
            <div className="message-actions">
              <button
                className="action-icon-btn"
                onClick={handleCopyMessage}
                title="Copy message content"
                aria-label="Copy message"
              >
                {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>

              <button
                className={`action-icon-btn ${liked ? 'active' : ''}`}
                onClick={() => { setLiked(!liked); setDisliked(false); }}
                title="Good response"
                aria-label="Like response"
              >
                <ThumbsUp size={14} />
              </button>

              <button
                className={`action-icon-btn ${disliked ? 'active' : ''}`}
                onClick={() => { setDisliked(!disliked); setLiked(false); }}
                title="Bad response"
                aria-label="Dislike response"
              >
                <ThumbsDown size={14} />
              </button>

              {isLastAssistantMessage && !isGenerating && onRegenerate && (
                <button
                  className="action-icon-btn"
                  onClick={onRegenerate}
                  title="Regenerate response"
                  aria-label="Regenerate response"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              <button className="action-icon-btn" title="More options" aria-label="More options">
                <MoreHorizontal size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
