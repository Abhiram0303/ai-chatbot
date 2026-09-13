import React, { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import SuggestionCards from './SuggestionCards';
import NovaLogo from '../branding/NovaLogo';
import { ArrowDown } from 'lucide-react';

/**
 * ChatWindow Component (NOVA SaaS Design)
 *
 * Deterministic Empty-State Behavior:
 * - When messages.length === 0: Renders the fresh-chat empty state UI.
 * - When messages.length > 0: Renders the message stream.
 *
 * Polished ChatGPT-style Scroll Control:
 * - When opening an existing saved chat / refresh / search: Viewport starts at scrollTop = 0 (TOP).
 * - NO auto-scrolling during AI streaming generation; position remains 100% stable; never follows tokens.
 * - Only scrolls once when a new user message is submitted in the current conversation.
 * - Floating circular ↓ button appears when new content is >100px below visible viewport.
 * - Clicking ↓ scrolls smoothly to latest content once and hides the button.
 * - Manual scrolling is completely free in both directions.
 */
export default function ChatWindow({
  activeChatId,
  messages,
  isGenerating,
  onSelectPrompt,
  onRegenerate,
}) {
  const scrollContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const lastUserMessageIdRef = useRef(null);
  const currentChatIdRef = useRef(activeChatId);
  const isSwitchingChatRef = useRef(true);

  // Disable default browser scroll restoration on refresh so saved chat opens at top
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Detect when activeChatId changes (user clicks another chat or refreshes)
  useEffect(() => {
    if (activeChatId !== currentChatIdRef.current) {
      currentChatIdRef.current = activeChatId;
      isSwitchingChatRef.current = true;
    }
  }, [activeChatId]);

  /**
   * Calculate distance from the bottom of the scroll container.
   * distanceFromBottom = scrollHeight - scrollTop - clientHeight
   */
  const checkDistanceFromBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return 0;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  }, []);

  /**
   * Updates the visibility of the floating circular ↓ button.
   * Show when distanceFromBottom > 100px and messages exist.
   * Hide when distanceFromBottom <= 100px.
   * IMPORTANT: This calculation ONLY updates button visibility; it NEVER auto-scrolls.
   */
  const updateScrollBtnVisibility = useCallback(() => {
    const distFromBottom = checkDistanceFromBottom();
    setShowScrollBtn(distFromBottom > 100 && messages.length > 0);
  }, [checkDistanceFromBottom, messages.length]);

  /**
   * Manual scroll handler: user is free to scroll up or down.
   * Updates only the down arrow button visibility.
   */
  const handleScroll = useCallback(() => {
    updateScrollBtnVisibility();
  }, [updateScrollBtnVisibility]);

  /**
   * Viewport Scroll Manager:
   * 1. When an existing saved chat is opened / switched to, or loaded after refresh:
   *    -> Scroll to TOP (scrollTop = 0) once.
   * 2. When the user submits a new message in the current conversation:
   *    -> Scroll once to show the new user message (scrollTop = scrollHeight).
   * 3. During AI streaming:
   *    -> NEVER auto-scroll; viewport remains 100% stable; never follows tokens.
   */
  useLayoutEffect(() => {
    if (messages.length === 0) {
      lastUserMessageIdRef.current = null;
      isSwitchingChatRef.current = false;
      return;
    }

    const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user');

    // Case 1: An existing saved chat was opened, switched to, or refreshed (not actively generating)
    if (isSwitchingChatRef.current && !isGenerating) {
      isSwitchingChatRef.current = false;
      lastUserMessageIdRef.current = latestUserMsg ? latestUserMsg.id : null;

      const scrollToTop = () => {
        const el = scrollContainerRef.current;
        if (el) {
          el.scrollTop = 0;
          updateScrollBtnVisibility();
        }
      };

      scrollToTop();
      requestAnimationFrame(() => {
        scrollToTop();
        requestAnimationFrame(scrollToTop);
      });
      return;
    }

    // Case 2: User submitted a NEW message in the current conversation
    if (latestUserMsg && latestUserMsg.id !== lastUserMessageIdRef.current) {
      lastUserMessageIdRef.current = latestUserMsg.id;
      isSwitchingChatRef.current = false;

      requestAnimationFrame(() => {
        const el = scrollContainerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
          updateScrollBtnVisibility();
        }
      });
    }
  }, [messages, activeChatId, isGenerating, updateScrollBtnVisibility]);

  /**
   * Monitor content growth (e.g. streaming tokens expanding below viewport)
   * via ResizeObserver and message updates to show ↓ button without moving scroll position.
   */
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollBtnVisibility();

    const resizeObserver = new ResizeObserver(() => {
      updateScrollBtnVisibility();
    });

    resizeObserver.observe(el);

    const streamEl = el.querySelector('.messages-stream');
    if (streamEl) {
      resizeObserver.observe(streamEl);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateScrollBtnVisibility]);

  // Update button visibility when messages or generation state change
  useEffect(() => {
    updateScrollBtnVisibility();
  }, [messages, isGenerating, updateScrollBtnVisibility]);

  /**
   * Clicking the down arrow smoothly moves the viewport to the latest content.
   */
  const handleScrollToLatest = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
  };

  const isEmptyState = messages.length === 0;

  // Find index of the last assistant message to enable Regenerate button
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  // Show typing indicator only when generating and the last assistant message content is currently empty
  const showTypingIndicator =
    isGenerating &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    !messages[messages.length - 1].content;

  // Fresh Chat Empty State (messages.length === 0)
  if (isEmptyState) {
    return (
      <div className="chat-window-container empty-state-container" ref={scrollContainerRef}>
        {/* Nova Hero Welcome Banner */}
        <div className="welcome-hero-section">
          <div className="welcome-text-side">
            <span className="hero-subhead">YOUR AI COMPANION</span>
            <h1 className="hero-heading">
              I'm <span className="gradient-text">NOVA</span>
            </h1>
            <p className="hero-subtitle">What can I help you create?</p>
          </div>

          <div className="welcome-graphic-side">
            <NovaLogo size={104} showText={false} className="hero-logo-badge" />
          </div>
        </div>

        {/* 4 Feature Shortcut Cards */}
        <SuggestionCards onSelectPrompt={onSelectPrompt} />

        {/* Footer Watermark Text (Visible ONLY on zero messages) */}
        <footer className="workspace-footer">
          <span>PRIVATE</span>
          <span className="dot-divider">•</span>
          <span>FAST</span>
          <span className="dot-divider">•</span>
          <span>POWERED BY AI</span>
          <span className="dot-divider">•</span>
          <span>BUILT FOR CREATORS</span>
        </footer>
      </div>
    );
  }

  // Active Conversation View (messages.length > 0)
  return (
    <>
      <div
        className="chat-window-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div className="messages-stream">
          {messages.map((msg, index) => {
            // Skip rendering empty placeholder assistant bubble until first token arrives
            if (msg.role === 'assistant' && !msg.content && isGenerating && index === messages.length - 1) {
              return null;
            }

            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRegenerate={onRegenerate}
                isLastAssistantMessage={index === lastAssistantIndex}
                isGenerating={isGenerating}
              />
            );
          })}

          {showTypingIndicator && <TypingIndicator />}
        </div>
      </div>

      {/* Floating Circular Down Arrow Button */}
      {showScrollBtn && (
        <button
          className="scroll-to-latest-btn"
          onClick={handleScrollToLatest}
          title="Scroll to latest"
          aria-label="Scroll to latest"
        >
          <ArrowDown size={18} strokeWidth={2.2} />
        </button>
      )}
    </>
  );
}
