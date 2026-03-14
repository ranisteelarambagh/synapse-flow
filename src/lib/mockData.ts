import type { Node, Edge } from '@xyflow/react';
import type { NodeData } from '@/stores/workflowStore';

export const mockNodes: Node<NodeData>[] = [
  {
    id: 'input-1',
    type: 'synapse',
    position: { x: 50, y: 200 },
    data: {
      label: 'Input',
      category: 'io',
      nodeType: 'input',
      status: 'idle',
      icon: '📥',
      config: { trigger: 'webhook', payload: 'user_query' },
      inputs: [],
      outputs: ['data'],
    },
  },
  {
    id: 'agent-1',
    type: 'synapse',
    position: { x: 350, y: 150 },
    selected: true,
    data: {
      label: 'Agent',
      category: 'ai',
      nodeType: 'agent',
      status: 'idle',
      icon: '🤖',
      config: { model: 'llama-3.3-70b', temperature: 0.7, maxTokens: 2048, systemPrompt: 'You are a helpful research assistant.' },
      inputs: ['input'],
      outputs: ['output'],
    },
  },
  {
    id: 'http-1',
    type: 'synapse',
    position: { x: 650, y: 280 },
    data: {
      label: 'HTTP Request',
      category: 'tool',
      nodeType: 'http-request',
      status: 'error',
      icon: '🌐',
      config: { method: 'POST', url: 'https://api.example.com/enrich' },
      inputs: ['request'],
      outputs: ['response'],
      description: 'Connection timeout after 5000ms',
    },
  },
  {
    id: 'output-1',
    type: 'synapse',
    position: { x: 650, y: 80 },
    data: {
      label: 'Output',
      category: 'io',
      nodeType: 'output',
      status: 'idle',
      icon: '📤',
      config: { format: 'json' },
      inputs: ['data'],
      outputs: [],
    },
  },
];

export const mockEdges: Edge[] = [
  { id: 'e1', source: 'input-1', target: 'agent-1', type: 'smoothstep', animated: false },
  { id: 'e2', source: 'agent-1', target: 'http-1', type: 'smoothstep', animated: false },
  { id: 'e3', source: 'agent-1', target: 'output-1', type: 'smoothstep', animated: false },
];

export const mockExecutionResults = {
  'input-1': { nodeId: 'input-1', status: 'success' as const, duration: 12, input: null, output: { query: 'summarize this document' } },
  'agent-1': { nodeId: 'agent-1', status: 'success' as const, duration: 1840, input: { query: 'summarize this document' }, output: { response: 'Here is a summary of the document. The key points are...' } },
  'http-1': { nodeId: 'http-1', status: 'error' as const, duration: 5000, input: { url: 'https://api.example.com/enrich' }, error: 'Connection timeout after 5000ms' },
  'output-1': { nodeId: 'output-1', status: 'idle' as const, duration: 0 },
};
