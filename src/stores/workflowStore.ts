import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';
export type NodeCategory = 'ai' | 'tool' | 'logic' | 'io';

export interface NodeData {
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

interface WorkflowStore {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  unsavedChanges: boolean;
  isRunning: boolean;
  executionResults: Record<string, NodeResult>;
  comments: Comment[];
  workspaceName: string;

  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (id: string | null) => void;
  setUnsavedChanges: (v: boolean) => void;
  setIsRunning: (v: boolean) => void;
  setExecutionResults: (r: Record<string, NodeResult>) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setWorkspaceName: (name: string) => void;
  addComment: (comment: Comment) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
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
  ],
  workspaceName: 'AI Research Pipeline',

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
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      unsavedChanges: true,
    })),
}));
