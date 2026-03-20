import { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useExecutionStore } from '@/stores/executionStore';
import { useExecution } from '@/hooks/useExecution';
import { useVoice } from '@/hooks/useVoice';
import { useTheme } from '@/components/ThemeProvider';
import {
  Play, Square, Search, Share2, ChevronDown, User, Mic, Download,
  Sun, Moon, Zap, Menu, X, Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportJSON, exportLangGraph, downloadFile } from '@/lib/exportUtils';
import { useParams } from 'react-router-dom';

// ─── Logo ─────────────────────────────────────────────────────────────────────
function SynapseLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative w-7 h-7 shrink-0">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="absolute inset-0">
          <defs>
            <radialGradient id="logo-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="logo-grad" x1="4" y1="14" x2="24" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6C63FF" />
              <stop offset="1" stopColor="#00D4AA" />
            </linearGradient>
          </defs>
          <circle cx="14" cy="14" r="13" fill="url(#logo-glow)" />
          <circle cx="9" cy="14" r="4.5" stroke="url(#logo-grad)" strokeWidth="1.8" fill="none" />
          <circle cx="20" cy="14" r="3" stroke="url(#logo-grad)" strokeWidth="1.8" fill="none" />
          <line x1="13.5" y1="14" x2="17" y2="14" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      {!compact && (
        <span
          className="text-[15px] font-display font-bold bg-clip-text text-transparent tracking-tight"
          style={{ backgroundImage: 'linear-gradient(90deg, #6C63FF 0%, #00D4AA 100%)' }}
        >
          Synapse
        </span>
      )}
    </div>
  );
}

// ─── Collaborator presence ─────────────────────────────────────────────────────
function Presence({ collaborators }: { collaborators: any[] }) {
  const onlineCount = collaborators.length + 1;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {collaborators.slice(0, 3).map((c) => (
          <Tooltip key={c.id}>
            <TooltipTrigger asChild>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-[1.5px] ring-syn-surface cursor-default select-none shrink-0 animate-presence-in"
                style={{ background: c.color }}
              >
                {c.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] font-ui">
              {c.name} · {c.activeNodeId ? 'editing' : 'viewing'}
            </TooltipContent>
          </Tooltip>
        ))}
        <div className="w-6 h-6 rounded-full bg-syn-violet/80 ring-[1.5px] ring-syn-surface flex items-center justify-center text-[9px] font-bold text-white shrink-0">
          You
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-syn-teal animate-pulse-dot" />
        <span className="text-[11px] font-ui text-syn-text-secondary">{onlineCount}</span>
      </div>
    </div>
  );
}

// ─── Run modal ─────────────────────────────────────────────────────────────────
function RunModal({ onRun, onClose }: { onRun: (input: string) => void; onClose: () => void }) {
  const [input, setInput] = useState('');
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
      <div
        className="relative w-full max-w-[480px] rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,0.7)] border border-syn-border-active p-6 animate-fade-in-up"
        style={{ background: 'hsl(var(--bg-raised))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-syn-violet/20 flex items-center justify-center">
            <Play className="w-4 h-4 text-syn-violet" />
          </div>
          <div>
            <h2 className="text-[15px] font-display font-bold text-foreground">Run Workflow</h2>
            <p className="text-[11px] text-syn-text-muted font-ui">Provide an optional JSON input for the trigger</p>
          </div>
        </div>
        <textarea
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) { onRun(input); onClose(); } }}
          placeholder='{ "query": "summarize this document" }'
          rows={4}
          className="w-full px-3 py-2 text-xs font-mono bg-syn-hover border border-syn-border rounded-lg text-foreground resize-none focus:outline-none transition-all"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-[10px] text-syn-text-muted font-ui">⌘↵ to run immediately</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 h-9 text-xs font-ui text-syn-text-secondary bg-syn-hover rounded-lg hover:bg-syn-border transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => { onRun(input); onClose(); }}
              className="px-5 h-9 text-xs font-display font-semibold bg-syn-violet text-white rounded-lg hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(108,99,255,0.4)]"
            >
              <Play className="w-3 h-3" /> Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export dropdown ──────────────────────────────────────────────────────────
function ExportDropdown({ nodes, edges, workspaceName }: { nodes: any[]; edges: any[]; workspaceName: string }) {
  const [open, setOpen] = useState(false);

  const handleJSON = () => {
    downloadFile(exportJSON(nodes, edges, workspaceName), `${workspaceName}.json`, 'application/json');
    setOpen(false);
  };
  const handlePython = () => {
    downloadFile(exportLangGraph(nodes, edges, workspaceName), `${workspaceName}.py`, 'text/plain');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 px-2.5 text-[11px] font-ui text-syn-text-secondary hover:bg-syn-hover hover:text-foreground rounded-lg flex items-center gap-1.5 transition-all"
        data-testid="button-export"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Export</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 z-40 bg-syn-raised border border-syn-border-active rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] min-w-[160px] overflow-hidden animate-fade-in-up p-1">
            <button onClick={handleJSON}
              className="w-full px-3 py-2 text-left text-[12px] font-ui text-syn-text-secondary hover:text-foreground hover:bg-syn-hover rounded-lg transition-all flex items-center gap-2.5"
            >
              <span className="text-base">📄</span>
              <div>
                <div className="font-medium">JSON</div>
                <div className="text-[10px] text-syn-text-muted">Workflow definition</div>
              </div>
            </button>
            <button onClick={handlePython}
              className="w-full px-3 py-2 text-left text-[12px] font-ui text-syn-text-secondary hover:text-foreground hover:bg-syn-hover rounded-lg transition-all flex items-center gap-2.5"
            >
              <span className="text-base">🐍</span>
              <div>
                <div className="font-medium">Python / LangGraph</div>
                <div className="text-[10px] text-syn-text-muted">Runnable code</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Topbar ──────────────────────────────────────────────────────────────
export default function Topbar() {
  const { workspaceName, setWorkspaceName, unsavedChanges, isRunning, nodes, edges } = useWorkflowStore();
  const { setCommandPaletteOpen, toggleShortcuts } = useUIStore();
  const { collaborators } = useCollaborationStore();
  const { runsRemaining } = useExecutionStore();
  const { theme, toggle: toggleTheme } = useTheme();

  const params = useParams<{ id: string }>();
  const workspaceId = params.id || 'demo';

  const { run, cancel, canRun } = useExecution(workspaceId);
  const { isRecording, startRecording, stopRecording, transcript } = useVoice(workspaceId);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(workspaceName);
  const [sharing, setSharing] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    if (editValue.trim()) setWorkspaceName(editValue.trim());
    else setEditValue(workspaceName);
  }, [editValue, workspaceName, setWorkspaceName]);

  const handleRunClick = () => {
    if (isRunning) { cancel(); return; }
    setShowRunModal(true);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/workspace/${workspaceId}`);
      useWorkflowStore.getState().addToast({ type: 'success', message: '🔗 Share link copied!' });
    } catch {
      useWorkflowStore.getState().addToast({ type: 'error', message: 'Failed to copy link' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* ── Glass topbar ─────────────────────────────────────────────── */}
      <header
        className="h-12 shrink-0 z-50 relative flex items-center gap-2 px-3 border-b border-syn-border"
        style={{
          background: 'rgba(8,10,18,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* ── Left: Logo + Title ───────────────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none">
          <SynapseLogo />

          <span className="hidden sm:block text-syn-border-active font-ui text-sm px-1">/</span>

          {/* Workspace name — inline edit */}
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => e.key === 'Enter' && commitEdit()}
              className="bg-transparent text-sm font-ui text-foreground border-b border-syn-violet outline-none px-1 py-0.5 min-w-[120px] max-w-[220px]"
              data-testid="input-workspace-name"
            />
          ) : (
            <button
              onDoubleClick={() => { setEditing(true); setEditValue(workspaceName); }}
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-ui text-foreground/80 hover:text-foreground transition-colors min-w-0 max-w-[200px]"
              data-testid="button-workspace-name"
            >
              <span className="truncate">{workspaceName}</span>
              {unsavedChanges && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-1.5 h-1.5 rounded-full bg-syn-amber animate-pulse-dot shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px]">Unsaved changes</TooltipContent>
                </Tooltip>
              )}
            </button>
          )}
        </div>

        {/* ── Center: Presence (desktop) ───────────────────────────── */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
          <Presence collaborators={collaborators} />
        </div>

        {/* ── Right: Actions ───────────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-1">

          {/* Runs remaining pill */}
          {runsRemaining < 20 && (
            <div className="hidden sm:flex items-center gap-1 px-2 h-6 rounded-full bg-syn-amber/10 border border-syn-amber/30">
              <Zap className="w-2.5 h-2.5 text-syn-amber" />
              <span className="text-[10px] font-ui text-syn-amber">{runsRemaining}</span>
            </div>
          )}

          {/* Search — desktop */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex h-7 px-2.5 items-center gap-1.5 text-[11px] font-ui text-syn-text-secondary bg-syn-raised border border-syn-border rounded-lg hover:bg-syn-hover hover:border-syn-border-active transition-all"
            data-testid="button-search"
          >
            <Search className="w-3 h-3" />
            <span className="hidden md:inline text-syn-text-muted">⌘K</span>
          </button>

          {/* Keyboard shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleShortcuts}
                className="hidden sm:flex w-7 h-7 items-center justify-center text-syn-text-muted hover:bg-syn-hover hover:text-foreground rounded-lg transition-all"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">Keyboard shortcuts (?)</TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-syn-text-secondary hover:bg-syn-hover transition-all"
                data-testid="button-theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </TooltipContent>
          </Tooltip>

          {/* Voice */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all relative',
                  isRecording
                    ? 'bg-syn-red text-white shadow-[0_0_16px_rgba(255,71,87,0.6)] animate-glow-pulse'
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
              {isRecording ? 'Recording — release to stop' : 'Hold for voice command'}
            </TooltipContent>
          </Tooltip>

          {/* Share — desktop */}
          <button
            onClick={handleShare}
            disabled={sharing}
            className="hidden sm:flex h-7 px-2.5 items-center gap-1.5 text-[11px] font-ui text-syn-text-secondary hover:bg-syn-hover hover:text-foreground rounded-lg transition-all disabled:opacity-50"
            data-testid="button-share"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{sharing ? 'Copying...' : 'Share'}</span>
          </button>

          {/* Export — desktop */}
          <div className="hidden sm:block">
            <ExportDropdown nodes={nodes as any} edges={edges} workspaceName={workspaceName} />
          </div>

          {/* Run / Stop — always visible */}
          <button
            onClick={handleRunClick}
            disabled={!isRunning && !canRun}
            className={cn(
              'h-8 px-3 sm:px-4 text-[12px] sm:text-sm font-display font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all active:scale-[0.97] shrink-0',
              isRunning
                ? 'bg-syn-red text-white shadow-[0_0_20px_rgba(255,71,87,0.4)]'
                : canRun
                  ? 'bg-syn-violet text-white shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:brightness-110'
                  : 'bg-syn-violet/30 text-white/40 cursor-not-allowed'
            )}
            data-testid="button-run-workflow"
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Run</span>
                <kbd className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded border border-white/20 opacity-70">⌘R</kbd>
              </>
            )}
          </button>

          {/* Avatar */}
          <button className="w-7 h-7 rounded-full bg-gradient-to-br from-syn-violet/30 to-syn-teal/20 flex items-center justify-center ring-2 ring-syn-violet/30 hover:ring-syn-violet transition-all shrink-0">
            <User className="w-3.5 h-3.5 text-syn-violet" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden w-7 h-7 flex items-center justify-center text-syn-text-secondary hover:bg-syn-hover rounded-lg transition-all"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Mobile dropdown menu ───────────────────────────────── */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-[70] top-12" onClick={() => setMobileMenuOpen(false)} />
            <div
              className="sm:hidden fixed top-12 left-0 right-0 z-[75] border-b border-syn-border-active p-3 flex flex-col gap-2 animate-fade-in-up"
              style={{ background: 'rgba(8,10,18,0.98)', backdropFilter: 'blur(20px)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile workspace name */}
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-syn-raised">
                <SynapseLogo compact />
                <span className="text-sm font-ui text-foreground/80 truncate flex-1">{workspaceName}</span>
                {unsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-syn-amber" />}
              </div>

              {/* Mobile presence */}
              <div className="flex items-center justify-between px-2">
                <Presence collaborators={collaborators} />
                <div className="text-[11px] font-ui text-syn-text-muted">Live session</div>
              </div>

              <div className="h-px bg-syn-border" />

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setCommandPaletteOpen(true); setMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-1 py-3 px-2 bg-syn-raised rounded-xl text-[11px] font-ui text-syn-text-secondary hover:bg-syn-hover hover:text-foreground transition-all">
                  <Search className="w-4 h-4" />
                  Search
                </button>
                <button onClick={() => { handleShare(); setMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-1 py-3 px-2 bg-syn-raised rounded-xl text-[11px] font-ui text-syn-text-secondary hover:bg-syn-hover hover:text-foreground transition-all">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button onClick={() => { toggleShortcuts(); setMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-1 py-3 px-2 bg-syn-raised rounded-xl text-[11px] font-ui text-syn-text-secondary hover:bg-syn-hover hover:text-foreground transition-all">
                  <Keyboard className="w-4 h-4" />
                  Keys
                </button>
              </div>

              {/* Export row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { downloadFile(exportJSON(nodes as any, edges, workspaceName), `${workspaceName}.json`, 'application/json'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 py-2.5 px-3 bg-syn-raised rounded-xl text-[12px] font-ui text-syn-text-secondary hover:bg-syn-hover transition-all"
                >
                  <span>📄</span> JSON
                </button>
                <button
                  onClick={() => { downloadFile(exportLangGraph(nodes as any, edges, workspaceName), `${workspaceName}.py`, 'text/plain'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 py-2.5 px-3 bg-syn-raised rounded-xl text-[12px] font-ui text-syn-text-secondary hover:bg-syn-hover transition-all"
                >
                  <span>🐍</span> Python
                </button>
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 py-2.5 px-3 bg-syn-raised rounded-xl text-[12px] font-ui text-syn-text-secondary hover:bg-syn-hover transition-all"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Switch to {theme === 'dark' ? 'light' : 'dark'} mode
              </button>
            </div>
          </>
        )}
      </header>

      {/* ── Voice transcript pill ──────────────────────────────────── */}
      {isRecording && transcript && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full border border-syn-border-active shadow-lg animate-fade-in-up"
          style={{ background: 'rgba(8,10,18,0.95)', backdropFilter: 'blur(16px)' }}>
          <span className="w-2 h-2 rounded-full bg-syn-red animate-pulse-dot" />
          <span className="text-sm font-ui text-foreground max-w-[calc(100vw-160px)] truncate">{transcript}</span>
        </div>
      )}

      {/* ── Run modal ────────────────────────────────────────────── */}
      {showRunModal && <RunModal onRun={run} onClose={() => setShowRunModal(false)} />}
    </TooltipProvider>
  );
}
