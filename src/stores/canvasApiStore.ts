import { create } from 'zustand';
import type { Node } from '@xyflow/react';
import type { NodeData } from './workflowStore';

/**
 * A shared "bus" that lets any hook or component imperatively talk to the canvas
 * without creating a circular reactivity loop.
 */
interface CanvasApiStore {
  addNode: ((node: Node<NodeData>) => void) | null;
  setEdgeAnimating: ((edgeId: string, animating: boolean) => void) | null;
  fitView: (() => void) | null;

  register: (api: {
    addNode: (node: Node<NodeData>) => void;
    setEdgeAnimating: (edgeId: string, animating: boolean) => void;
    fitView: () => void;
  }) => void;
  unregister: () => void;
}

export const useCanvasApiStore = create<CanvasApiStore>((set) => ({
  addNode: null,
  setEdgeAnimating: null,
  fitView: null,

  register: (api) => set({ ...api }),
  unregister: () => set({ addNode: null, setEdgeAnimating: null, fitView: null }),
}));
