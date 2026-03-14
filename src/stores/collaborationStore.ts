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

interface CollaborationStore {
  collaborators: Collaborator[];
  localUserId: string;
  setCollaborators: (c: Collaborator[]) => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  localUserId: 'local-user',
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
}));
