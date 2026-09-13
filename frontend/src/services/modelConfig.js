/**
 * Central AI Model Configuration
 * Single source of truth for all model IDs, display names, and provider mappings.
 * Never stores API keys or tokens.
 */

export const AI_MODELS = [
  {
    id: 'auto',
    label: 'Auto',
    subtitle: 'Best available',
    provider: 'auto',
    model: null,
    group: null,
  },
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    subtitle: 'Google',
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    group: 'GOOGLE',
  },
  {
    id: 'openai/gpt-oss-120b',
    label: 'GPT-OSS 120B',
    subtitle: 'Groq',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    group: 'GROQ',
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'GPT-OSS 20B',
    subtitle: 'Groq',
    provider: 'groq',
    model: 'openai/gpt-oss-20b',
    group: 'GROQ',
  },
];

export const DEFAULT_MODEL_ID = 'auto';
export const STORAGE_KEY = 'nova_selected_model';

/**
 * Returns the full model config object for the given ID, or the default.
 */
export function getModelById(id) {
  return AI_MODELS.find((m) => m.id === id) || AI_MODELS[0];
}

/**
 * Load persisted model selection from localStorage.
 */
export function getSelectedModelId() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AI_MODELS.some((m) => m.id === stored)) {
      return stored;
    }
  } catch (_) {
    // localStorage unavailable
  }
  return DEFAULT_MODEL_ID;
}

/**
 * Persist model selection to localStorage.
 */
export function saveSelectedModelId(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch (_) {
    // localStorage unavailable
  }
}
