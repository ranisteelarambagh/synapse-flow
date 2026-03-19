import { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useExecutionStore } from '@/stores/executionStore';
import { useExecution } from '@/hooks/useExecution';
import { useVoice } from '@/hooks/useVoice';
import { useTheme } from '@/components/ThemeProvider';
import { Play, Square, Search, Share2, ChevronDown, User, Mic, Download, Sun, Moon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportJSON, exportLangGraph, downloadFile } from '@/lib/exportUtils';
import { useParams } from 'react-router-dom';

function SynapseLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="12" r="4" stroke="url(#logo-grad)" strokeWidth="2" fill="none" />
        <circle cx="18" cy="12" r="3" stroke="url(#logo-grad)" strokeWidth="2" fill="none" />
        <line x1="12" y1="12" x2="15" y2="12" stroke="url(#logo-grad)" strokeWidth="2" />
        <defs>
          <linearGradient id="logo-grad" x1="4" y1="12" x2="21" y2="12">
            <stop stopColor="#6C63FF" />
            <stop offset="1" stopColor="#00D4AA" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="text-base font-display font-bold bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(90deg, #6C63FF, #00D4AA)' }}
      >
        Synapse
      </span>
    </div>
  );
}

function RunModal({ onRun, onClose }: { onRun: (input: string) => void; onClose: () => void }) {
  const [input, setInput] = useState('');
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-[480px] bg-syn-raised border border-syn-border-active rounded-xl shadow-2xl p-6 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-display font-semibold text-foreground mb-1">Run Workflow</h2>
        <p className="text-xs text-syn-text-secondary mb-4 font-ui">Provide an optional input to pass to the workflow trigger.</p>
        <textarea
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) { onRun(input); onClose(); } }}
          placeholder='{"query": "summarize this document"}'
          rows={4}
          className="w-full px-3 py-2 text-xs font-mono bg-syn-hover border border-syn-border rounded-md text-foreground resize-none focus:outline-none focus:border-syn-violet transition-all"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-[10px] text-syn-text-muted font-ui">⌘↵ to run</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 h-8 text-xs font-ui text-syn-text-secondary hover:text-foreground bg-syn-hover rounded-md hover:bg-syn-border transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => { onRun(input); onClose(); }}
              className="px-4 h-8 text-xs font-display font-semibold bg-syn-violet text-white rounded-md hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-1.5"
            >
              <Play className="w-3 h-3" /> Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Topbar() {
  const { workspaceName, setWorkspaceName, unsavedChanges, isRunning, nodes, edges } = useWorkflowStore();
  const { setCommandPaletteOpen } = useUIStore();
  const { collaborators } = useCollaborationStore();
  const { runsRemaining } = useExecutionStore();
  const { theme, toggle: toggleTheme } = useTheme();

  const params = useParams<{ id: string }>();
  const workspaceId = params.id || 'demo';

  const { run, cancel, canRun } = useExecution(workspaceId);
  const { isRecording, startRecording, stopRecording, transcript } = useVoice(workspaceId);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(workspaceName);
  const [exportOpen, setExportOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    if (editValue.trim()) setWorkspaceName(editValue.trim());
    else setEditValue(workspaceName);
  };

  const handleRunClick = () => {
    if (isRunning) { cancel(); return; }
    setShowRunModal(true);
  };

  const getCollaboratorAction = (c: typeof collaborators[0]) => {
    if (c.activeNodeId) return `editing node`;
    return 'viewing';
  };

  const getRelativeTime = (date: Date) => {
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1m ago';
    return `${minutes}m ago`;
  };

  const onlineCount = collaborators.length + 1;

  const handleShare = async () => {
    setSharing(true);
    try {
      const shareUrl = `${window.location.origin}/workspace/${workspaceId}`;
      await navigator.clipboard.writeText(shareUrl);
      useWorkflowStore.getState().addToast({ type: 'success', message: 'Share link copied to clipboard!' });
    } catch {
      useWorkflowStore.getState().addToast({ type: 'error', message: 'Failed to copy share link' });
    } finally {
      setSharing(false);
    }
  };

  const handleExportJSON = () => {
    const json = exportJSON(nodes as any, edges, workspaceName);
    downloadFile(json, `${workspaceName}.json`, 'application/json');
    setExportOpen(false);
  };

  const handleExportPython = () => {
    const python = exportLangGraph(nodes as any, edges, workspaceName);
    downloadFile(python, `${workspaceName}.py`, 'text/plain');
    setExportOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-12 bg-syn-surface border-b border-syn-border flex items-center px-3 gap-3 shrink-0 z-50 relative">
        {/* Left */}
        <SynapseLogo />
        <span className="text-syn-text-muted font-ui text-sm" style={{ margin: '0 8px' }}>/</span>

        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => e.key === 'Enter' && commitEdit()}
            className="bg-transparent text-sm font-ui text-foreground border-b border-syn-border-active outline-none px-1 py-0.5 caret-syn-violet"
            data-testid="input-workspace-name"
          />
        ) : (
          <button
            onDoubleClick={() => { setEditing(true); setEditValue(workspaceName); }}
            className="text-sm font-ui text-foreground hover:underline decoration-syn-border-active underline-offset-4 transition-all"
            data-testid="button-workspace-name"
          >
            {workspaceName}
          </button>
        )}

        {unsavedChanges && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-1.5 h-1.5 rounded-full bg-syn-amber animate-pulse-dot" data-testid="status-unsaved" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">Unsaved changes</TooltipContent>
          </Tooltip>
        )}

        {/* Center — presence */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {collaborators.map((c) => (
              <Tooltip key={c.id}>
                <TooltipTrigger asChild>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground ring-2 animate-presence-in cursor-default select-none"
                    style={{ backgroundColor: c.color + '33', boxShadow: `0 0 0 2px ${c.color}` }}
                    data-testid={`avatar-collaborator-${c.id}`}
                  >
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-syn-raised border border-syn-border-active font-ui text-[11px] px-2 py-1"
                >
                  {c.name} · {getCollaboratorAction(c)} · {getRelativeTime(c.lastActive)}
                </TooltipContent>
              </Tooltip>
            ))}
            <div className="w-7 h-7 rounded-full bg-syn-violet/30 ring-2 ring-syn-violet flex items-center justify-center text-[10px] font-bold text-foreground">
              You
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-2 h-2 rounded-full bg-syn-teal animate-pulse-dot" />
            <span className="text-xs font-ui text-syn-text-secondary">{onlineCount} online</span>
          </div>
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Runs remaining */}
          {runsRemaining < 20 && (
            <div className="flex items-center gap-1 px-2 h-7 rounded-md bg-syn-amber/10 border border-syn-amber/30">
              <Zap className="w-3 h-3 text-syn-amber" />
              <span className="text-[11px] font-ui text-syn-amber">{runsRemaining} runs left</span>
            </div>
          )}

          {/* Search */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="h-8 px-3 text-xs font-ui text-syn-text-secondary bg-syn-raised border border-syn-border rounded-md hover:bg-syn-hover transition-all duration-150 flex items-center gap-1.5"
            data-testid="button-search"
          >
            <Search className="w-3.5 h-3.5" />
            <span>⌘K</span>
          </button>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-md flex items-center justify-center text-syn-text-secondary hover:bg-syn-hover transition-all duration-150"
                data-testid="button-theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              Switch to {theme === 'dark' ? 'light' : 'dark'} mode
            </TooltipContent>
          </Tooltip>

          {/* Voice */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 relative',
                  isRecording
                    ? 'bg-syn-red text-white animate-glow-pulse'
                    : 'text-syn-text-secondary hover:bg-syn-hover'
                )}
                data-testid="button-voice"
              >
                <Mic className="w-3.5 h-3.5" />
                {isRecording && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-syn-red border border-syn-surface animate-pulse-dot" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              {isRecording ? 'Recording... release to stop' : 'Hold to record voice command'}
            </TooltipContent>
          </Tooltip>

          {/* Run / Stop */}
          <button
            onClick={handleRunClick}
            disabled={!isRunning && !canRun}
            className={cn(
              'h-9 px-4 text-sm font-display font-semibold rounded-md flex items-center gap-2 transition-all duration-150',
              isRunning
                ? 'bg-syn-red text-white animate-node-pulse'
                : canRun
                  ? 'bg-syn-violet text-white hover:brightness-110 active:scale-[0.97]'
                  : 'bg-syn-violet/40 text-white/50 cursor-not-allowed'
            )}
            data-testid="button-run-workflow"
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run Workflow
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-white/20 ml-1">⌘R</kbd>
              </>
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            disabled={sharing}
            className="h-8 px-3 text-xs font-ui text-syn-text-secondary hover:bg-syn-hover rounded-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            data-testid="button-share"
          >
            <Share2 className="w-3.5 h-3.5" />
            {sharing ? 'Copying...' : 'Share'}
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="h-8 px-3 text-xs font-ui text-syn-text-secondary hover:bg-syn-hover rounded-md flex items-center gap-1.5 transition-all"
              data-testid="button-export"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className={cn('w-3 h-3 transition-transform', exportOpen && 'rotate-180')} />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                <div className="absolute top-full right-0 mt-1 z-40 bg-syn-raised border border-syn-border rounded-md shadow-lg min-w-40 animate-fade-in-up">
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-3 py-2 text-left text-xs font-ui text-syn-text-secondary hover:text-foreground hover:bg-syn-hover transition-all flex items-center gap-2"
                    data-testid="button-export-json"
                  >
                    <span>📄</span> JSON
                  </button>
                  <button
                    onClick={handleExportPython}
                    className="w-full px-3 py-2 text-left text-xs font-ui text-syn-text-secondary hover:text-foreground hover:bg-syn-hover transition-all flex items-center gap-2"
                    data-testid="button-export-python"
                  >
                    <span>🐍</span> Python / LangGraph
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-syn-violet/20 flex items-center justify-center ring-2 ring-syn-violet/30 hover:ring-syn-violet transition-all cursor-pointer">
            <User className="w-4 h-4 text-syn-violet" />
          </div>
        </div>
      </div>

      {/* Voice transcript pill */}
      {isRecording && transcript && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 bg-syn-raised border border-syn-border rounded-full shadow-lg voice-transcript">
          <span className="w-2 h-2 rounded-full bg-syn-red animate-pulse-dot" />
          <span className="text-sm font-ui text-foreground max-w-[400px] truncate">{transcript}</span>
        </div>
      )}

      {/* Run modal */}
      {showRunModal && (
        <RunModal
          onRun={run}
          onClose={() => setShowRunModal(false)}
        />
      )}
    </TooltipProvider>
  );
}
