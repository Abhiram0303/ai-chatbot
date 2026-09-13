import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

/**
 * CodeBlock Component
 * Styled container for markdown code blocks with language badge and copy button.
 */
export default function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard:', err);
    }
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-lang">
          <Code size={13} style={{ opacity: 0.7 }} />
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="code-copy-btn"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
