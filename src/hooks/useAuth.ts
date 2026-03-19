import { useState, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  avatar?: string;
  limits: {
    voiceEnabled: boolean;
    videoEnabled: boolean;
    maxNodes: number;
    runsPerDay: number;
  };
}

const STORAGE_KEY = 'synapse_user';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

let globalUser: User | null = loadUser();
const listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function useAuth() {
  const [, rerender] = useState(0);
  const addToast = useWorkflowStore(s => s.addToast);

  const subscribe = useCallback(() => {
    const fn = () => rerender(n => n + 1);
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 800));
    const user: User = {
      id: 'u_' + Math.random().toString(36).slice(2, 8),
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      plan: 'pro',
      limits: { voiceEnabled: true, videoEnabled: false, maxNodes: 50, runsPerDay: 100 },
    };
    globalUser = user;
    saveUser(user);
    notifyListeners();
    addToast({ type: 'success', message: `Welcome back, ${user.name}!` });
  }, [addToast]);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 1000));
    const user: User = {
      id: 'u_' + Math.random().toString(36).slice(2, 8),
      name,
      email,
      plan: 'free',
      limits: { voiceEnabled: false, videoEnabled: false, maxNodes: 20, runsPerDay: 10 },
    };
    globalUser = user;
    saveUser(user);
    notifyListeners();
    addToast({ type: 'success', message: `Account created! Welcome, ${name}!` });
  }, [addToast]);

  const logout = useCallback(() => {
    globalUser = null;
    saveUser(null);
    notifyListeners();
    addToast({ type: 'info', message: 'Signed out successfully.' });
  }, [addToast]);

  return { user: globalUser, login, register, logout, subscribe };
}
