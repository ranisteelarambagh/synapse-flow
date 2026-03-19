import { create } from 'zustand';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor: { x: number; y: number } | null;
  activeNodeId: string | null;
  lastActive: Date;
}

export interface CursorOverlay {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface CollaborationStore {
  collaborators: Collaborator[];
  cursors: Record<string, CursorOverlay>;
  localUserId: string;
  localCursor: { x: number; y: number } | null;

  setCollaborators: (c: Collaborator[]) => void;
  updateCursor: (x: number, y: number) => void;
  updateActiveNode: (nodeId: string | null) => void;
  setCursors: (cursors: Record<string, CursorOverlay>) => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  localUserId: 'local-user',
  localCursor: null,
  cursors: {},
  collaborators: [
    {
      id: 'maya',
      name: 'Maya Chen',
      color: '#00D4AA',
      avatar: '',
      cursor: { x: 400, y: 300 },
      activeNodeId: 'agent-1',
      lastActive: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      id: 'alex',
      name: 'Alex Rivera',
      color: '#FFB800',
      avatar: '',
      cursor: { x: 700, y: 500 },
      activeNodeId: null,
      lastActive: new Date(Date.now() - 5 * 60 * 1000),
    },
  ],
  setCollaborators: (c) => set({ collaborators: c }),
  updateCursor: (x, y) => set({ localCursor: { x, y } }),
  updateActiveNode: (nodeId) =>
    set((state) => ({
      collaborators: state.collaborators.map(c =>
        c.id === state.localUserId ? { ...c, activeNodeId: nodeId } : c
      ),
    })),
  setCursors: (cursors) => set({ cursors }),
}));
