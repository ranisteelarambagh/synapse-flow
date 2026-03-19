import { create } from 'zustand';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  nodeId?: string;
  nodeName?: string;
  message: string;
}

export interface TimelineStep {
  nodeId: string;
  nodeName: string;
  status: 'success' | 'error' | 'running' | 'skipped';
  duration: number;
  icon: string;
}

interface ExecutionStore {
  logs: LogEntry[];
  timeline: TimelineStep[];
  isStreaming: boolean;
  nodeStatuses: Record<string, string>;
  liveChunks: Record<string, string>;
  runsRemaining: number;

  addLog: (log: LogEntry) => void;
  setTimeline: (t: TimelineStep[]) => void;
  setIsStreaming: (v: boolean) => void;
  clearLogs: () => void;
  setLiveChunk: (nodeId: string, updater: string | null | ((prev: string) => string)) => void;
  setRunsRemaining: (updater: number | ((prev: number) => number)) => void;
  setNodeStatuses: (s: Record<string, string>) => void;
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  logs: [
    { id: '1', timestamp: new Date(Date.now() - 5000), level: 'INFO', nodeName: 'Input', message: 'Workflow started — trigger: webhook' },
    { id: '2', timestamp: new Date(Date.now() - 4800), level: 'INFO', nodeName: 'Input', message: 'Received payload: { query: "summarize this document" }' },
    { id: '3', timestamp: new Date(Date.now() - 3000), level: 'DEBUG', nodeName: 'Agent', message: 'Model: llama-3.3-70b · temp: 0.7 · max_tokens: 2048' },
    { id: '4', timestamp: new Date(Date.now() - 1200), level: 'INFO', nodeName: 'Agent', message: 'Response generated in 1840ms (347 tokens)' },
    { id: '5', timestamp: new Date(Date.now() - 1000), level: 'ERROR', nodeName: 'HTTP Request', message: 'Connection timeout after 5000ms — https://api.example.com/enrich' },
    { id: '6', timestamp: new Date(Date.now() - 800), level: 'WARN', nodeName: 'Output', message: 'Skipped — upstream node failed' },
  ],
  timeline: [
    { nodeId: 'input-1', nodeName: 'Input', status: 'success', duration: 12, icon: '📥' },
    { nodeId: 'agent-1', nodeName: 'Agent', status: 'success', duration: 1840, icon: '🤖' },
    { nodeId: 'http-1', nodeName: 'HTTP Request', status: 'error', duration: 5000, icon: '🌐' },
    { nodeId: 'output-1', nodeName: 'Output', status: 'skipped', duration: 0, icon: '📤' },
  ],
  isStreaming: false,
  nodeStatuses: {},
  liveChunks: {},
  runsRemaining: 100,

  addLog: (log) => set((s) => ({ logs: [...s.logs.slice(-200), log] })),
  setTimeline: (t) => set({ timeline: t }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  clearLogs: () => set({ logs: [] }),
  setLiveChunk: (nodeId, updater) =>
    set((s) => ({
      liveChunks: {
        ...s.liveChunks,
        [nodeId]: updater === null
          ? ''
          : typeof updater === 'function'
            ? updater(s.liveChunks[nodeId] || '')
            : updater,
      },
    })),
  setRunsRemaining: (updater) =>
    set((s) => ({
      runsRemaining: typeof updater === 'function' ? updater(s.runsRemaining) : updater,
    })),
  setNodeStatuses: (s) => set({ nodeStatuses: s }),
}));
