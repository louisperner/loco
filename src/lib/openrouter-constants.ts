// OpenRouter shared constants

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro EXP' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google/gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
  { id: 'google/gemma-3-4b-it:free', name: 'Gemma 4B' },
  { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B' },
  { id: 'groq/grok-3-beta', name: 'Grok 3 Beta' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
  { id: 'mistralai/mistral-medium', name: 'Mistral Medium' },
  { id: 'mistralai/mistral-small', name: 'Mistral Small' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'microsoft/mai-ds-r1:free', name: 'mai-ds' },
  { id: 'cohere/command-r', name: 'Cohere Command R' },
  { id: 'cohere/command-r-plus', name: 'Cohere Command R+' },
  { id: 'anthropic/claude-instant-1', name: 'Claude Instant' },
  { id: 'thudm/glm-z1-9b:free', name: 'thudm' }
];

// Streaming support providers
export const OPENROUTER_STREAMING_PROVIDERS = [
  'openai/', 'anthropic/', 'fireworks/', 'mancer/', 'recursal/',
  'anyscale/', 'lepton/', 'octoai/', 'novita/', 'deepinfra/',
  'together/', 'cohere/', 'hyperbolic/', 'infermatic/', 'avian/',
  'xai/', 'cloudflare/', 'sfcompute/', 'nineteen/', 'liquid/',
  'friendli/', 'chutes/', 'deepseek/'
];

// Helper function to check if a model supports streaming
export const isStreamingSupported = (modelId: string) => {
  return true;
}; 