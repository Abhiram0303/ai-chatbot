import React from 'react';
import NovaLogo from '../branding/NovaLogo';

/**
 * TypingIndicator Component
 * Renders animated dots inside a bot bubble while Nova is generating the first response token.
 */
export default function TypingIndicator() {
  return (
    <div className="message-row bot">
      <div className="avatar-container bot-nova">
        <NovaLogo size={42} showText={false} />
      </div>
      <div>
        <div className="typing-indicator">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <div className="message-time">Nova is thinking...</div>
      </div>
    </div>
  );
}
