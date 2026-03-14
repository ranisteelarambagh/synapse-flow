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
  selected

NodeId: string | null;
  unsavedChanges: boolean;
      isRunning: boolean;
  executionResults: Record<string, NodeResult>;
  comments: Comment[];
  workspaceName: string;

  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  selectNode commit: (id: string | null) => void;
  setUnsavedChanges: (v: boolean) => void;
  setIsRunning: (v: boolean) => void;
  setExecutionResults: (r: Record<string, NodeResult>) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setWorkspaceName: (name: string) => void;
  addComment: (comment: Comment) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  unsavedChanges: false,
  isRunning: false,
  executionResults: {},
  comments: [],
  workspaceName: 'AI Research Pipeline',

  setNodes: (nodes) => set({ nodes, unsavedChanges: true }),
  setEdges: (edges) => set({ edges, unsavedChanges: true }),
  onNodesChange: () => {},
  onEdgesChange: () => {},
  selectNode: (id) => set({ selectedNodeId: id }),
  setUnsavedChanges: (v) => set({ unsavedChanges: v }),
  setIsRunning: (v) => set({ isRunning: v }),
  setExecutionResults: (r) => set({ executionResults: r }),
  setNodeStatus: (nodeId, status) => set((state) => ({
    nodes: state.nodes.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
    ),
  })),
  setWorkspaceName: (name) => set({ workspaceName: name, unsavedChanges: true }),
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
}));
