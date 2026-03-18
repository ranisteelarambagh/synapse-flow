import { API_BASE_URL } from '@/config';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
  },
};

export const workspaceApi = {
  get: async (id: string): Promise<Workspace> => {
    const res = await fetch(`${API_BASE_URL}/workspaces/${id}`);
    if (!res.ok) throw new Error('Failed to load workspace');
    return res.json();
  },

  save: async (id: string, data: any): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save workspace');
  },
};

export const executeWorkflow = async (
  workspaceId: string,
  input: any
): Promise<ReadableStream<string>> => {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error('Execution failed');
  return res.body!;
};

export const commentsApi = {
  create: async (workspaceId: string, content: string, nodeId?: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, nodeId }),
    });
    if (!res.ok) throw new Error('Failed to create comment');
    return res.json();
  },

  react: async (commentId: string, emoji: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) throw new Error('Failed to add reaction');
  },

  delete: async (commentId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete comment');
  },
};
