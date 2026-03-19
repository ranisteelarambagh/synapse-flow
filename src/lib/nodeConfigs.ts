export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'slider' | 'toggle' | 'code' | 'url' | 'method-group' | 'tags';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  description?: string;
  monospace?: boolean;
}

export interface NodeConfig {
  type: string;
  label: string;
  description: string;
  category: 'ai' | 'tool' | 'logic' | 'io';
  icon: string;
  fields: FieldConfig[];
  inputs: string[];
  outputs: string[];
  defaultConfig: Record<string, any>;
}

export const MODELS = [
  { value: 'llama-3.3-70b', label: 'llama-3.3-70b · Groq · FREE' },
  { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash · Google · FREE' },
  { value: 'mistral-7b', label: 'mistral-7b · Mistral · FREE' },
  { value: 'gpt-4o', label: 'gpt-4o · OpenAI · PAID' },
  { value: 'claude-3-5-sonnet', label: 'claude-3-5-sonnet · Anthropic · PAID' },
  { value: 'claude-3-haiku', label: 'claude-3-haiku · Anthropic · FREE' },
  { value: 'deepseek-r1', label: 'deepseek-r1 · DeepSeek · FREE' },
];

export const EMBEDDING_MODELS = [
  { value: 'text-embedding-3-small', label: 'text-embedding-3-small · OpenAI' },
  { value: 'text-embedding-3-large', label: 'text-embedding-3-large · OpenAI' },
  { value: 'embed-english-v3.0', label: 'embed-english-v3.0 · Cohere' },
];

export const NODE_CONFIGS: Record<string, NodeConfig> = {
  agent: {
    type: 'agent',
    label: 'Agent',
    description: 'Autonomous AI agent with memory + tool access',
    category: 'ai',
    icon: '🤖',
    inputs: ['input'],
    outputs: ['output'],
    defaultConfig: { model: 'llama-3.3-70b', temperature: 0.7, maxTokens: 2048, systemPrompt: '' },
    fields: [
      { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant...', monospace: true },
      { key: 'model', label: 'Model', type: 'select', options: MODELS },
      { key: 'temperature', label: 'Temperature', type: 'slider', min: 0, max: 2, step: 0.1, description: 'Precise → Creative' },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', placeholder: '2048', min: 1, max: 128000 },
    ],
  },
  'llm-call': {
    type: 'llm-call',
    label: 'LLM Call',
    description: 'Direct language model call with prompt template',
    category: 'ai',
    icon: '💬',
    inputs: ['prompt'],
    outputs: ['response'],
    defaultConfig: { model: 'gemini-2.0-flash', temperature: 0.5, maxTokens: 1024, promptTemplate: '' },
    fields: [
      { key: 'promptTemplate', label: 'Prompt Template', type: 'textarea', placeholder: 'Use {{input}} as a variable', monospace: true },
      { key: 'model', label: 'Model', type: 'select', options: MODELS },
      { key: 'temperature', label: 'Temperature', type: 'slider', min: 0, max: 2, step: 0.1 },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', placeholder: '1024' },
    ],
  },
  memory: {
    type: 'memory',
    label: 'Memory',
    description: 'Store and retrieve conversation context',
    category: 'ai',
    icon: '🧠',
    inputs: ['store'],
    outputs: ['recall'],
    defaultConfig: { type: 'buffer', maxEntries: 100 },
    fields: [
      { key: 'type', label: 'Memory Type', type: 'select', options: [
        { value: 'buffer', label: 'Buffer (Last N messages)' },
        { value: 'summary', label: 'Summary (Compressed)' },
        { value: 'vector', label: 'Vector (Semantic search)' },
      ]},
      { key: 'maxEntries', label: 'Max Entries', type: 'number', placeholder: '100', min: 1, max: 10000 },
    ],
  },
  embedder: {
    type: 'embedder',
    label: 'Embedder',
    description: 'Generate vector embeddings',
    category: 'ai',
    icon: '📐',
    inputs: ['text'],
    outputs: ['embedding'],
    defaultConfig: { model: 'text-embedding-3-small', dimensions: 1536 },
    fields: [
      { key: 'model', label: 'Embedding Model', type: 'select', options: EMBEDDING_MODELS },
      { key: 'dimensions', label: 'Dimensions', type: 'number', placeholder: '1536' },
    ],
  },
  classifier: {
    type: 'classifier',
    label: 'Classifier',
    description: 'Route inputs via AI classification',
    category: 'ai',
    icon: '🏷️',
    inputs: ['input'],
    outputs: ['category', 'confidence'],
    defaultConfig: { categories: [], model: 'llama-3.3-70b' },
    fields: [
      { key: 'categories', label: 'Categories', type: 'tags', placeholder: 'Add category...' },
      { key: 'model', label: 'Model', type: 'select', options: MODELS },
    ],
  },
  'http-request': {
    type: 'http-request',
    label: 'HTTP Request',
    description: 'Call any external API',
    category: 'tool',
    icon: '🌐',
    inputs: ['request'],
    outputs: ['response'],
    defaultConfig: { method: 'GET', url: '', headers: {}, body: '' },
    fields: [
      { key: 'url', label: 'URL', type: 'url', placeholder: 'https://api.example.com/endpoint' },
      { key: 'method', label: 'Method', type: 'method-group' },
      { key: 'body', label: 'Request Body', type: 'textarea', placeholder: '{"key": "value"}', monospace: true },
    ],
  },
  'code-runner': {
    type: 'code-runner',
    label: 'Code Runner',
    description: 'Run JavaScript or Python inline',
    category: 'tool',
    icon: '⚡',
    inputs: ['input'],
    outputs: ['output'],
    defaultConfig: { language: 'javascript', code: '' },
    fields: [
      { key: 'language', label: 'Language', type: 'select', options: [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'python', label: 'Python' },
      ]},
      { key: 'code', label: 'Code', type: 'code', placeholder: '// Your code here...' },
    ],
  },
  'file-reader': {
    type: 'file-reader',
    label: 'File Reader',
    description: 'Parse uploaded files',
    category: 'tool',
    icon: '📄',
    inputs: ['file'],
    outputs: ['content'],
    defaultConfig: { format: 'auto' },
    fields: [
      { key: 'format', label: 'Format', type: 'select', options: [
        { value: 'auto', label: 'Auto-detect' },
        { value: 'text', label: 'Plain Text' },
        { value: 'json', label: 'JSON' },
        { value: 'csv', label: 'CSV' },
        { value: 'pdf', label: 'PDF' },
      ]},
    ],
  },
  'web-scraper': {
    type: 'web-scraper',
    label: 'Web Scraper',
    description: 'Extract content from URLs',
    category: 'tool',
    icon: '🕷️',
    inputs: ['url'],
    outputs: ['content'],
    defaultConfig: { selector: 'body', javascript: false },
    fields: [
      { key: 'selector', label: 'CSS Selector', type: 'text', placeholder: 'body, .main-content, #article' },
      { key: 'javascript', label: 'Execute JavaScript', type: 'toggle' },
    ],
  },
  router: {
    type: 'router',
    label: 'Router',
    description: 'Conditional branching',
    category: 'logic',
    icon: '🔀',
    inputs: ['input'],
    outputs: ['true', 'false'],
    defaultConfig: { condition: '', operator: 'contains' },
    fields: [
      { key: 'condition', label: 'Condition Value', type: 'text', placeholder: 'expected value' },
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'less_than', label: 'Less Than' },
        { value: 'regex', label: 'Regex Match' },
      ]},
    ],
  },
  merger: {
    type: 'merger',
    label: 'Merger',
    description: 'Combine multiple data streams',
    category: 'logic',
    icon: '🔗',
    inputs: ['a', 'b'],
    outputs: ['merged'],
    defaultConfig: { strategy: 'merge' },
    fields: [
      { key: 'strategy', label: 'Merge Strategy', type: 'select', options: [
        { value: 'merge', label: 'Deep Merge' },
        { value: 'concat', label: 'Concatenate' },
        { value: 'first', label: 'First Non-Null' },
      ]},
    ],
  },
  loop: {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate over arrays',
    category: 'logic',
    icon: '🔄',
    inputs: ['array'],
    outputs: ['item', 'done'],
    defaultConfig: { maxIterations: 100 },
    fields: [
      { key: 'maxIterations', label: 'Max Iterations', type: 'number', placeholder: '100', min: 1, max: 10000 },
    ],
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    description: 'Timed pause',
    category: 'logic',
    icon: '⏱️',
    inputs: ['trigger'],
    outputs: ['continue'],
    defaultConfig: { ms: 1000 },
    fields: [
      { key: 'ms', label: 'Delay (ms)', type: 'number', placeholder: '1000', min: 0, max: 60000 },
    ],
  },
  input: {
    type: 'input',
    label: 'Input',
    description: 'Workflow entry point',
    category: 'io',
    icon: '📥',
    inputs: [],
    outputs: ['data'],
    defaultConfig: { trigger: 'manual', payload: '' },
    fields: [
      { key: 'trigger', label: 'Trigger', type: 'select', options: [
        { value: 'manual', label: 'Manual' },
        { value: 'webhook', label: 'Webhook' },
        { value: 'schedule', label: 'Schedule' },
        { value: 'event', label: 'Event' },
      ]},
      { key: 'payload', label: 'Default Payload', type: 'textarea', placeholder: '{"query": "..."}', monospace: true },
    ],
  },
  output: {
    type: 'output',
    label: 'Output',
    description: 'Final result collection',
    category: 'io',
    icon: '📤',
    inputs: ['data'],
    outputs: [],
    defaultConfig: { format: 'json' },
    fields: [
      { key: 'format', label: 'Output Format', type: 'select', options: [
        { value: 'json', label: 'JSON' },
        { value: 'text', label: 'Plain Text' },
        { value: 'html', label: 'HTML' },
        { value: 'markdown', label: 'Markdown' },
      ]},
    ],
  },
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'External event trigger',
    category: 'io',
    icon: '🪝',
    inputs: [],
    outputs: ['payload'],
    defaultConfig: { path: '/webhook', method: 'POST' },
    fields: [
      { key: 'path', label: 'Webhook Path', type: 'url', placeholder: '/webhook/my-trigger' },
      { key: 'method', label: 'HTTP Method', type: 'select', options: [
        { value: 'POST', label: 'POST' },
        { value: 'GET', label: 'GET' },
      ]},
    ],
  },
};

export const ORDERED_CATEGORIES: Array<'ai' | 'tool' | 'logic' | 'io'> = ['ai', 'tool', 'logic', 'io'];

export const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  ai: { label: 'AI Nodes', icon: '🤖', color: '#6C63FF' },
  tool: { label: 'Tool Nodes', icon: '🔧', color: '#00D4AA' },
  logic: { label: 'Logic Nodes', icon: '🔀', color: '#FFB800' },
  io: { label: 'I/O Nodes', icon: '📥', color: '#FF4757' },
};

export function buildDefaultNode(type: string, position: { x: number; y: number }, id?: string) {
  const cfg = NODE_CONFIGS[type];
  if (!cfg) return null;
  const nodeId = id || `${type}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: nodeId,
    type: 'synapse',
    position,
    data: {
      label: cfg.label,
      category: cfg.category,
      nodeType: cfg.type,
      status: 'idle',
      icon: cfg.icon,
      config: { ...cfg.defaultConfig },
      inputs: cfg.inputs,
      outputs: cfg.outputs,
    },
  };
}
