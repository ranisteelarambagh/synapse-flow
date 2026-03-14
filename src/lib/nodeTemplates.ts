import { NodeCategory } from '@/stores/workflowStore';

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  ai: 'var(--violet)',
  tool: 'var(--teal)',
  logic: 'var(--amber)',
  io: 'var(--red)',
};

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  ai: 'AI Nodes',
  tool: 'Tool Nodes',
  logic: 'Logic Nodes',
  io: 'I/O Nodes',
};

export const CATEGORY_ICONS: Record<NodeCategory, string> = {
  ai: '🤖',
  tool: '🔧',
  logic: '🔀',
  io: '📥',
};

export interface NodeTemplate {
  nodeType: string;
  label: string;
  description: string;
  category: NodeCategory;
  icon: string;
  defaultConfig: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  // AI Nodes
  { nodeType: 'agent', label: 'Agent', description: 'Autonomous AI agent with memory + tool access', category: 'ai', icon: '🤖', defaultConfig: { model: 'llama-3.3-70b', temperature: 0.7, maxTokens: 2048, systemPrompt: '' }, inputs: ['input'], outputs: ['output'] },
  { nodeType: 'llm-call', label: 'LLM Call', description: 'Direct language model call with prompt template', category: 'ai', icon: '💬', defaultConfig: { model: 'gemini-2.0-flash', temperature: 0.5, maxTokens: 1024 }, inputs: ['prompt'], outputs: ['response'] },
  { nodeType: 'memory', label: 'Memory', description: 'Store and retrieve conversation context', category: 'ai', icon: '🧠', defaultConfig: { type: 'buffer', maxEntries: 100 }, inputs: ['store'], outputs: ['recall'] },
  { nodeType: 'embedder', label: 'Embedder', description: 'Generate vector embeddings', category: 'ai', icon: '📐', defaultConfig: { model: 'text-embedding-3-small', dimensions: 1536 }, inputs: ['text'], outputs: ['embedding'] },
  { nodeType: 'classifier', label: 'Classifier', description: 'Route inputs via AI classification', category: 'ai', icon: '🏷️', defaultConfig: { categories: [] }, inputs: ['input'], outputs: ['category', 'confidence'] },

  // Tool Nodes
  { nodeType: 'http-request', label: 'HTTP Request', description: 'Call any external API', category: 'tool', icon: '🌐', defaultConfig: { method: 'GET', url: '', headers: {} }, inputs: ['request'], outputs: ['response'] },
  { nodeType: 'code-runner', label: 'Code Runner', description: 'Run JavaScript or Python inline', category: 'tool', icon: '⚡', defaultConfig: { language: 'javascript', code: '' }, inputs: ['input'], outputs: ['output'] },
  { nodeType: 'file-reader', label: 'File Reader', description: 'Parse uploaded files', category: 'tool', icon: '📄', defaultConfig: { format: 'auto' }, inputs: ['file'], outputs: ['content'] },
  { nodeType: 'web-scraper', label: 'Web Scraper', description: 'Extract content from URLs', category: 'tool', icon: '🕷️', defaultConfig: { selector: 'body' }, inputs: ['url'], outputs: ['content'] },

  // Logic Nodes
  { nodeType: 'router', label: 'Router', description: 'Conditional branching', category: 'logic', icon: '🔀', defaultConfig: { conditions: [] }, inputs: ['input'], outputs: ['true', 'false'] },
  { nodeType: 'merger', label: 'Merger', description: 'Combine multiple data streams', category: 'logic', icon: '🔗', defaultConfig: { strategy: 'merge' }, inputs: ['a', 'b'], outputs: ['merged'] },
  { nodeType: 'loop', label: 'Loop', description: 'Iterate over arrays', category: 'logic', icon: '🔄', defaultConfig: { maxIterations: 100 }, inputs: ['array'], outputs: ['item', 'done'] },
  { nodeType: 'delay', label: 'Delay', description: 'Timed pause', category: 'logic', icon: '⏱️', defaultConfig: { ms: 1000 }, inputs: ['trigger'], outputs: ['continue'] },

  // I/O Nodes
  { nodeType: 'input', label: 'Input', description: 'Workflow entry point', category: 'io', icon: '📥', defaultConfig: { trigger: 'manual', payload: '' }, inputs: [], outputs: ['data'] },
  { nodeType: 'output', label: 'Output', description: 'Final result collection', category: 'io', icon: '📤', defaultConfig: { format: 'json' }, inputs: ['data'], outputs: [] },
  { nodeType: 'webhook', label: 'Webhook', description: 'External event trigger', category: 'io', icon: '🪝', defaultConfig: { path: '/webhook', method: 'POST' }, inputs: [], outputs: ['payload'] },
];
