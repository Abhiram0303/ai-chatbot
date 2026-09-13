/**
 * Dedicated API Service for Chat SSE Streaming
 * 
 * Handles HTTP connection, ReadableStream parsing for Server-Sent Events,
 * and signal cancellation with AbortController.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const GENERIC_ERROR_MESSAGE = "Sorry, I'm having trouble responding right now. Please try again.";

/**
 * Streams chat completion tokens from the backend.
 * 
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {Object} callbacks
 * @param {Function} callbacks.onText - Triggered when a text delta arrives
 * @param {Function} [callbacks.onReset] - Triggered when stream resets to fallback provider
 * @param {Function} callbacks.onDone - Triggered when stream completes normally
 * @param {Function} callbacks.onError - Triggered on streaming or server error
 * @param {AbortSignal} [callbacks.signal] - AbortController signal to stop stream
 * @param {string} [callbacks.provider] - Provider identifier (auto, gemini, groq)
 * @param {string|null} [callbacks.model] - Model identifier
 */
export async function streamChat(messages, { onText, onReset, onDone, onError, signal, provider, model }) {
  try {
    // Format messages payload (ensuring only valid role & non-empty content properties are sent)
    const formattedMessages = messages
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // Build request body with optional provider/model
    const requestBody = { messages: formattedMessages };
    if (provider) requestBody.provider = provider;
    if (model) requestBody.model = model;

    console.log('[streamChat] Sending request to:', `${API_BASE_URL}/api/chat/stream`, requestBody);

    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    console.log('[streamChat] Response status:', response.status, response.ok);

    if (!response.ok) {
      console.warn(`[streamChat] Server returned non-OK HTTP status: ${response.status}`);
      onError(GENERIC_ERROR_MESSAGE);
      return;
    }

    if (!response.body) {
      console.warn('[streamChat] Response body stream unavailable.');
      onError(GENERIC_ERROR_MESSAGE);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process lines separated by double newlines or single newlines
      const lines = buffer.split('\n');
      // Keep the last incomplete fragment in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'text') {
            onText(parsed.content);
          } else if (parsed.type === 'reset') {
            console.log('[streamChat] Internal reset event received. Clearing partial assistant tokens.');
            onReset?.();
          } else if (parsed.type === 'done') {
            onDone();
            return;
          } else if (parsed.type === 'error') {
            console.warn('[streamChat] Backend stream error event received:', parsed.message);
            onError(GENERIC_ERROR_MESSAGE);
            return;
          }
        } catch (jsonErr) {
          console.warn('Failed to parse SSE JSON payload:', dataStr, jsonErr);
        }
      }
    }

    // Call onDone if stream finished without explicit 'done' payload
    onDone();

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Stream generation aborted by user.');
      onDone(); // Complete cleanly on user stop action
    } else {
      console.error('Chat API Network Error:', err);
      onError(GENERIC_ERROR_MESSAGE);
    }
  }
}

/**
 * Health check endpoint call
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check status: ${response.status}`);
  }
  return response.json();
}
