import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import { nanoid } from 'nanoid';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';
export type NodeCategory = 'ai' | 'tool' | 'logic' | 'io';

export interface NodeData {
  [key: string]: unknown;
  label: string;
  description?: string;
  category: NodeCategory;
  nodeType: string;
  status: NodeStatus;
  config: Record<string, any>;
  icon?: string;
  inputs?: string[];
  outputs?: string[];
}

export interface NodeResult {
  nodeId: string;
  status: NodeStatus;
  duration: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface Comment {
  id: string;
  nodeId?: string;
  userId: string;
  userName: string;
  avatar?: string;
  text: string;
  timestamp: Date;
  reactions: Record<string, string[]>;
  replies?: Comment[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warn';
  message: string;
  duration?: number;
}

export interface FixSuggestion {
  nodeId: string;
  field: string;
  value: any;
  explanation: string;
}

interface WorkflowStore {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  unsavedChanges: boolean;
  isRunning: boolean;
  executionResults: Record<string, NodeResult>;
  comments: Comment[];
  workspaceName: string;
  workflowDescription: string;
  toasts: Toast[];
  voiceTranscript: string;
  fixStreaming: boolean;
  fixSuggestion: FixSuggestion | null;

  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (id: string | null) => void;
  setUnsavedChanges: (v: boolean) => void;
  setIsRunning: (v: boolean) => void;
  setExecutionResults: (r: Record<string, NodeResult>) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setWorkspaceName: (name: string) => void;
  setWorkflowDescription: (desc: string) => void;
  addComment: (comment: Comment) => void;
  removeComment: (id: string) => void;
  addReaction: (commentId: string, emoji: string, userId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setVoiceTranscript: (text: string) => void;
  setFixStreaming: (v: boolean) => void;
  setFixSuggestion: (s: FixSuggestion | null) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  unsavedChanges: false,
  isRunning: false,
  executionResults: {},
  comments: [
    {
      id: 'c1',
      nodeId: 'agent-1',
      userId: 'maya',
      userName: 'Maya Chen',
      text: 'Should we increase max tokens for longer docs?',
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      reactions: { '👍': ['alex', 'local-user'] },
    },
    {
      id: 'c2',
      nodeId: 'agent-1',
      userId: 'alex',
      userName: 'Alex Rivera',
      text: 'Good point! Also consider using a summary memory node before this.',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      reactions: { '💡': ['maya'] },
    },
  ],
  workspaceName: 'AI Research Pipeline',
  workflowDescription: '',
  toasts: [],
  voiceTranscript: '',
  fixStreaming: false,
  fixSuggestion: null,

  setNodes: (nodes) => set({ nodes, unsavedChanges: true }),
  setEdges: (edges) => set({ edges, unsavedChanges: true }),
  selectNode: (id) => set({ selectedNodeId: id }),
  setUnsavedChanges: (v) => set({ unsavedChanges: v }),
  setIsRunning: (v) => set({ isRunning: v }),
  setExecutionResults: (r) => set({ executionResults: r }),
  setNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
      ),
    })),
  setWorkspaceName: (name) => set({ workspaceName: name, unsavedChanges: true }),
  setWorkflowDescription: (desc) => set({ workflowDescription: desc, unsavedChanges: true }),
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
  removeComment: (id) => set((state) => ({ comments: state.comments.filter(c => c.id !== id) })),
  addReaction: (commentId, emoji, userId) =>
    set((state) => ({
      comments: state.comments.map(c =>
        c.id === commentId
          ? {
              ...c,
              reactions: {
                ...c.reactions,
                [emoji]: c.reactions[emoji]?.includes(userId)
                  ? c.reactions[emoji].filter(u => u !== userId)
                  : [...(c.reactions[emoji] || []), userId],
              },
            }
          : c
      ),
    })),
  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      unsavedChanges: true,
    })),
  addToast: (toast) => {
    const id = nanoid();
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { ...toast, id, duration: toast.duration ?? 4000 }],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, toast.duration ?? 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  setVoiceTranscript: (text) => set({ voiceTranscript: text }),
  setFixStreaming: (v) => set({ fixStreaming: v }),
  setFixSuggestion: (s) => set({ fixSuggestion: s }),
}));
