import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import ChatWindow from './components/chat/ChatWindow';
import ChatInput from './components/chat/ChatInput';
import AuthModal from './components/auth/AuthModal';
import DeleteConfirmModal from './components/chat/DeleteConfirmModal';
import RenameChatModal from './components/chat/RenameChatModal';
import SearchModal from './components/search/SearchModal';
import ExploreScreen from './components/explore/ExploreScreen';
import TemplatesScreen from './components/templates/TemplatesScreen';
import LibraryScreen from './components/library/LibraryScreen';
import SettingsScreen from './components/settings/SettingsScreen';
import SectionBackground from './components/backgrounds/SectionBackground';
import NovaLogo from './components/branding/NovaLogo';
import { AuthProvider, useAuth } from './context/AuthContext';
import { streamChat, checkHealth, GENERIC_ERROR_MESSAGE } from './services/chatApi';
import { getSelectedModelId, saveSelectedModelId, getModelById } from './services/modelConfig';
import {
  getUserChats,
  subscribeToUserChats,
  createChatDoc,
  saveChatMessageDoc,
  getChatMessages,
  renameChatDoc,
  deleteChatDoc,
} from './services/chatFirestore';

/**
 * NOVA Loading Screen
 * Shown while Firebase checks the auth session on initial load.
 */
function NovaLoadingScreen() {
  return (
    <div className="nova-loading-screen">
      <div className="nova-loading-content">
        <NovaLogo size={56} showText={true} textSub={true} />
        <div className="nova-loading-spinner-container">
          <div className="nova-loading-spinner"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Notice displayed when Firebase environment variables are not yet configured in frontend/.env
 */
function FirebaseConfigNotice() {
  return (
    <div className="auth-page-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <NovaLogo size={40} showText={true} textSub={true} />
          <h2 className="auth-title" style={{ marginTop: '16px', fontSize: '1.2rem' }}>
            Firebase Setup Required
          </h2>
          <p className="auth-subtitle" style={{ fontSize: '0.82rem' }}>
            Please paste your Firebase Web App credentials into <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>frontend/.env</code>.
          </p>
        </div>

        <div
          className="auth-success-banner"
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            borderColor: 'rgba(56, 189, 248, 0.25)',
            color: '#e2e8f0',
            fontSize: '0.8rem',
            textAlign: 'left',
            lineHeight: '1.5',
            marginTop: '16px',
            padding: '16px',
          }}
        >
          <strong style={{ color: '#38bdf8' }}>3-Step Firebase Integration Setup:</strong>
          <ol style={{ marginTop: '8px', paddingLeft: '20px', color: '#cbd5e1' }}>
            <li>Open your project in <strong>Firebase Console</strong></li>
            <li>Navigate to <strong>Project Settings &rarr; General &rarr; Your apps</strong></li>
            <li>Copy the SDK config values and paste into <strong style={{ color: '#fff' }}>frontend/.env</strong>:</li>
          </ol>
          <pre
            style={{
              background: '#060810',
              padding: '12px',
              borderRadius: '6px',
              marginTop: '12px',
              overflowX: 'auto',
              fontSize: '0.72rem',
              color: '#38bdf8',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
{`VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...`}
          </pre>
          <p style={{ marginTop: '12px', fontSize: '0.78rem', color: '#94a3b8' }}>
            ⚡ After updating <code style={{ color: '#fff' }}>frontend/.env</code>, restart your Vite server in terminal (<code style={{ color: '#fff' }}>npm run dev</code>).
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Chat Application Content Component
 */
function MainChatApp() {
  const { user, isAuthenticated, loading, isFirebaseConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [composerPrompt, setComposerPrompt] = useState('');

  // Model selection state (persisted to localStorage)
  const [selectedModelId, setSelectedModelId] = useState(() => getSelectedModelId());

  const handleSelectModel = (modelId) => {
    setSelectedModelId(modelId);
    saveSelectedModelId(modelId);
  };

  // Helper for capability/template prompt selection
  const handleUsePrompt = (promptText) => {
    setActiveTab('chat');
    setComposerPrompt(promptText);
  };

  // Action-based authentication modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const pendingActionRef = useRef(null);

  // Recent Chats & Active Conversation state
  const [recentChats, setRecentChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isChatsLoading, setIsChatsLoading] = useState(false);
  const hasHydratedSelectedChatRef = useRef(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [chatToRename, setChatToRename] = useState(null);

  // Chat messages state (empty array [] for fresh chat)
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);

  // Ref to hold active AbortController instance
  const abortControllerRef = useRef(null);

  // Subscribe to user chats in real-time from Firestore on authentication state change
  useEffect(() => {
    // While Firebase is still checking the auth session on initial load, do not clear state
    if (loading) return;

    let unsubscribe = () => {};

    if (user?.uid) {
      setIsChatsLoading(true);
      unsubscribe = subscribeToUserChats(
        user.uid,
        async (chats) => {
          setRecentChats(chats);
          setIsChatsLoading(false);

          // One-time hydration of selected chat on app load / refresh
          if (!hasHydratedSelectedChatRef.current) {
            hasHydratedSelectedChatRef.current = true;
            const savedChatId = localStorage.getItem('nova_selected_chat');
            if (savedChatId && chats.some((c) => c.id === savedChatId)) {
              setActiveChatId(savedChatId);
              try {
                const msgs = await getChatMessages(user.uid, savedChatId);
                setMessages(msgs);
              } catch (e) {
                console.error('[App] Failed to load messages for restored chat:', e);
              }
            } else if (savedChatId) {
              // Stale chat ID that no longer exists in Firestore
              localStorage.removeItem('nova_selected_chat');
            }
          }
        },
        (err) => {
          console.error('[App] Firestore chat subscription error:', err);
          setIsChatsLoading(false);
        }
      );
    } else {
      // User signed out or not logged in
      hasHydratedSelectedChatRef.current = false;
      setRecentChats([]);
      setActiveChatId(null);
      setMessages([]);
      localStorage.removeItem('nova_selected_chat');
      setIsChatsLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [user?.uid, loading]);

  /**
   * Internal silent backend health monitoring
   */
  const handleCheckHealth = useCallback(async () => {
    try {
      await checkHealth();
      setIsHealthy(true);
    } catch (err) {
      setIsHealthy(false);
    }
  }, []);

  useEffect(() => {
    handleCheckHealth();
  }, [handleCheckHealth]);

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global shortcut listener: Ctrl+K / Cmd+K to toggle Search modal
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Clean up active stream ONLY on full application unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Resets active conversation to empty state (messages.length = 0)
   */
  const handleNewChat = () => {
    if (isGenerating) handleStopGeneration();
    setActiveChatId(null);
    localStorage.removeItem('nova_selected_chat');
    setMessages([]);
    setActiveTab('chat');
  };

  /**
   * Selects a chat from the Recent Chats sidebar or Search Modal
   */
  const handleSelectChat = async (chatId) => {
    if (!chatId) return;
    if (isGenerating) return; // Do not abort active stream if clicking during streaming
    setActiveChatId(chatId);
    localStorage.setItem('nova_selected_chat', chatId);
    setActiveTab('chat');

    if (user?.uid) {
      const msgs = await getChatMessages(user.uid, chatId);
      setMessages(msgs);
    }
  };

  /**
   * Generates a clean, topic-focused conversation title from the first message text
   */
  const generateTitle = (text) => {
    if (!text || !text.trim()) return 'New Conversation';
    
    const lower = text.toLowerCase().trim();

    // Specific prompt matches for clean titles
    if (lower.includes('explain a complex concept')) return 'Concept Explanation';
    if (lower.includes('write clean code') || lower.includes('write code')) return 'Code Generation';
    if (lower.includes('summarize text')) return 'Text Summary';
    if (lower.includes('brainstorm ideas')) return 'Brainstorming Ideas';
    if (lower.includes('python expense tracker')) return 'Python Expense Tracker';
    if (lower.includes('react vs vue')) return 'React vs Vue';
    if (lower.includes('japan trip')) return 'Japan Trip Planning';
    if (lower.includes('neural network')) return 'Neural Networks';
    if (lower.includes('java')) return 'Java Overview';

    // General heuristic: strip action words and common stop-words
    const stopWords = new Set([
      'a', 'an', 'the', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'to', 'of',
      'from', 'by', 'is', 'are', 'me', 'my', 'your', 'help', 'please', 'can', 'you',
      'explain', 'write', 'build', 'summarize', 'brainstorm', 'how', 'what', 'why'
    ]);

    const words = text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const filtered = words.filter((w) => !stopWords.has(w.toLowerCase()));

    if (filtered.length >= 2) {
      const topicWords = filtered.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
      return topicWords.join(' ');
    }

    // Fallback: first 3-4 clean words
    const cleanWords = words.slice(0, 4).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return cleanWords.join(' ') || 'New Conversation';
  };

  /**
   * Internal message sender function
   */
  const executeSendMessage = async (userText) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: timeString,
      isError: false,
    };

    let currentChatId = activeChatId;

    // Immediately allocate and set active chat ID for new conversations
    if (!currentChatId) {
      currentChatId = `chat-${Date.now()}`;
      setActiveChatId(currentChatId);
      localStorage.setItem('nova_selected_chat', currentChatId);
      const title = generateTitle(userText);
      setRecentChats((prev) => [
        { id: currentChatId, title, updatedAt: new Date() },
        ...prev,
      ]);
    }

    const updatedHistory = [...messages, newUserMsg];
    const botMsgId = `bot-${Date.now()}`;
    const emptyBotMsg = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: timeString,
      isError: false,
    };

    setMessages([...updatedHistory, emptyBotMsg]);
    setIsGenerating(true);

    // Asynchronously create Firestore chat doc and save user message in background
    const isNewChat = !activeChatId || currentChatId !== activeChatId;
    const initChatPromise = (async () => {
      try {
        if (user?.uid) {
          if (isNewChat) {
            const title = generateTitle(userText);
            await createChatDoc(user.uid, currentChatId, title);
          }
          await saveChatMessageDoc(user.uid, currentChatId, newUserMsg);
        }
      } catch (err) {
        console.error('[App] Firestore init chat error:', err);
      }
    })();



    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedBotText = '';

    // Resolve current model config for the request
    const modelConfig = getModelById(selectedModelId);

    try {
      await streamChat(updatedHistory, {
        provider: modelConfig.provider,
        model: modelConfig.model,
        signal: controller.signal,
        onText: (textDelta) => {
          accumulatedBotText += textDelta;
          setMessages((prevMessages) => {
            const hasBotMsg = prevMessages.some((msg) => msg.id === botMsgId);
            if (!hasBotMsg) {
              return [
                ...prevMessages,
                {
                  id: botMsgId,
                  role: 'assistant',
                  content: textDelta,
                  timestamp: timeString,
                  isError: false,
                },
              ];
            }
            return prevMessages.map((msg) => {
              if (msg.id === botMsgId) {
                return { ...msg, content: msg.content + textDelta };
              }
              return msg;
            });
          });
        },

        onReset: () => {
          accumulatedBotText = '';
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === botMsgId ? { ...msg, content: '', isError: false } : msg
            )
          );
        },

        onDone: () => {
          setIsGenerating(false);
          abortControllerRef.current = null;
          setIsHealthy(true);

          // Persist assistant message in Firestore once streaming completes
          initChatPromise.then(async () => {
            if (user?.uid && currentChatId && accumulatedBotText) {
              try {
                await saveChatMessageDoc(user.uid, currentChatId, {
                  role: 'assistant',
                  content: accumulatedBotText,
                  timestamp: new Date(),
                  isError: false,
                });
              } catch (e) {
                console.error('[App] Failed to save bot response:', e);
              }
            }
          });
        },
        onError: () => {
          setIsGenerating(false);
          abortControllerRef.current = null;
          accumulatedBotText = '';

          setMessages((prevMessages) => {
            return prevMessages.map((msg) => {
              if (msg.id === botMsgId) {
                return {
                  ...msg,
                  content: GENERIC_ERROR_MESSAGE,
                  isError: true,
                };
              }
              return msg;
            });
          });
        },
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };



  /**
   * Submits user message (Action-gated by Authentication)
   */
  const handleSendMessage = (userText) => {
    if (isGenerating) return false;

    if (!isAuthenticated) {
      pendingActionRef.current = () => executeSendMessage(userText);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return false;
    }

    executeSendMessage(userText);
    return true;
  };

  /**
   * Executed upon successful authentication in AuthModal
   */
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingActionRef.current) {
      const pendingAction = pendingActionRef.current;
      pendingActionRef.current = null;
      pendingAction();
    }
  };

  /**
   * Permanently deletes a conversation from Firestore and local state
   */
  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;
    const deletedId = chatToDelete.id;

    // Delete from Firestore if authenticated
    if (user?.uid) {
      await deleteChatDoc(user.uid, deletedId);
    }

    // Immediately remove from sidebar list
    setRecentChats((prev) => prev.filter((c) => c.id !== deletedId));

    // If the deleted chat was the ACTIVE chat, return to empty state!
    if (activeChatId === deletedId) {
      if (isGenerating) handleStopGeneration();
      setActiveChatId(null);
      localStorage.removeItem('nova_selected_chat');
      setMessages([]);
    }
  };

  /**
   * Renames a conversation title in Firestore and local state
   */
  const handleConfirmRename = async (newTitle) => {
    if (!chatToRename) return;
    const renameId = chatToRename.id;

    if (user?.uid) {
      await renameChatDoc(user.uid, renameId, newTitle);
    }

    setRecentChats((prev) =>
      prev.map((c) => (c.id === renameId ? { ...c, title: newTitle } : c))
    );
  };

  /**
   * Stops current stream generation
   */
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  /**
   * Regenerates the last assistant response
   */
  const handleRegenerate = async () => {
    if (isGenerating) return;

    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    const lastAssistantIdx = messages.findLastIndex((m) => m.role === 'assistant');
    if (lastAssistantIdx === -1) return;

    const historyWithoutLastBot = messages.slice(0, lastAssistantIdx);
    
    // Re-run streaming
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const botMsgId = `bot-${Date.now()}`;
    const emptyBotMsg = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: timeString,
      isError: false,
    };

    setMessages([...historyWithoutLastBot, emptyBotMsg]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedBotText = '';

    // Resolve current model config for regeneration
    const modelConfig = getModelById(selectedModelId);

    try {
      await streamChat(historyWithoutLastBot, {
        provider: modelConfig.provider,
        model: modelConfig.model,
        signal: controller.signal,
        onText: (textDelta) => {
          accumulatedBotText += textDelta;
          setMessages((prevMessages) => {
            const hasBotMsg = prevMessages.some((msg) => msg.id === botMsgId);
            if (!hasBotMsg) {
              return [
                ...prevMessages,
                {
                  id: botMsgId,
                  role: 'assistant',
                  content: textDelta,
                  timestamp: timeString,
                  isError: false,
                },
              ];
            }
            return prevMessages.map((msg) => {
              if (msg.id === botMsgId) {
                return { ...msg, content: msg.content + textDelta };
              }
              return msg;
            });
          });
        },

        onReset: () => {
          accumulatedBotText = '';
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === botMsgId ? { ...msg, content: '', isError: false } : msg
            )
          );
        },

        onDone: () => {
          setIsGenerating(false);
          abortControllerRef.current = null;
          setIsHealthy(true);

          if (user?.uid && activeChatId && accumulatedBotText) {
            saveChatMessageDoc(user.uid, activeChatId, {
              role: 'assistant',
              content: accumulatedBotText,
              timestamp: new Date(),
              isError: false,
            });
          }
        },
        onError: () => {
          setIsGenerating(false);
          abortControllerRef.current = null;
          accumulatedBotText = '';

          setMessages((prevMessages) => {
            return prevMessages.map((msg) => {
              if (msg.id === botMsgId) {
                return {
                  ...msg,
                  content: GENERIC_ERROR_MESSAGE,
                  isError: true,
                };
              }
              return msg;
            });
          });
        },
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };


  // Show setup guide if Firebase environment variables are missing
  if (!isFirebaseConfigured) {
    return <FirebaseConfigNotice />;
  }

  // Show NOVA loading screen while Firebase checks initial session
  if (loading) {
    return <NovaLoadingScreen />;
  }

  // Public Home Screen: Render Main NOVA Chat Application Shell immediately for ALL users
  return (
    <div className="nova-app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        recentChats={recentChats}
        isChatsLoading={isChatsLoading}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onOpenRenameModal={(chat) => setChatToRename(chat)}
        onOpenDeleteModal={(chat) => setChatToDelete(chat)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="nova-main-viewport">
        <TopBar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuthModal={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
        />

        {/* Section-Specific Planetary Atmospheric Background */}
        <SectionBackground
          section={activeTab}
          isChatActive={messages.length > 0}
        />

        {activeTab === 'chat' && (
          <>
            <main className="nova-workspace-body">
              <ChatWindow
                activeChatId={activeChatId}
                messages={messages}
                isGenerating={isGenerating}
                onSelectPrompt={handleSendMessage}
                onRegenerate={handleRegenerate}
              />
            </main>

            <ChatInput
              onSendMessage={(userText) => {
                const result = handleSendMessage(userText);
                if (result) setComposerPrompt('');
                return result;
              }}
              onStopGeneration={handleStopGeneration}
              isGenerating={isGenerating}
              initialText={composerPrompt}
              selectedModelId={selectedModelId}
              onSelectModel={handleSelectModel}
            />
          </>
        )}

        {activeTab === 'explore' && (
          <ExploreScreen onSelectCapability={handleUsePrompt} />
        )}

        {activeTab === 'templates' && (
          <TemplatesScreen onUseTemplate={handleUsePrompt} />
        )}

        {activeTab === 'library' && (
          <LibraryScreen />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen />
        )}
      </div>

      {/* Action-Based Authentication Overlay Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          pendingActionRef.current = null;
        }}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Permanent Chat Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(chatToDelete)}
        chatTitle={chatToDelete?.title}
        onClose={() => setChatToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Rename Chat Modal */}
      <RenameChatModal
        isOpen={Boolean(chatToRename)}
        initialTitle={chatToRename?.title}
        onClose={() => setChatToRename(null)}
        onConfirm={handleConfirmRename}
      />

      {/* Global Conversation Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        recentChats={recentChats}
        onSelectChat={handleSelectChat}
      />
    </div>
  );
}

/**
 * Root App Wrapper with AuthProvider Context
 */
export default function App() {
  return (
    <AuthProvider>
      <MainChatApp />
    </AuthProvider>
  );
}
