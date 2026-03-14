import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { Play, Square, Search, Share2, ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function Topbar() {
  const { workspaceName, setWorkspaceName, unsavedChanges, isRunning, setIsRunning } = useWorkflowStore();
  const { setCommandPaletteOpen } = useUIStore();
  const { collaborators } = useCollaborationStore();

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(workspaceName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    if (editValue.trim()) setWorkspaceName(editValue.trim());
    else setEditValue(workspaceName);
  };

  const handleRun = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      setTimeout(() => setIsRunning(false), 3000);
    }
  };

  const onlineCount = collaborators.length + 1;

  return (
    <div className="h-12 bg-syn-surface border-b border-syn-border flex items-center px-3 gap-3 shrink-0 z-50 relative">
      {/* Left */}
      <SynapseLogo />
      <span className="text-syn-text-muted font-ui text-sm">/</span>

      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          className="bg-transparent text-sm font-ui text-foreground border-b border-syn-border-active outline-none px-1 py-0.5 caret-syn-violet"
        />
      ) : (
        <button
          onDoubleClick={() => { setEditing(true); setEditValue(workspaceName); }}
          className="text-sm font-ui text-foreground hover:underline decoration-syn-border-active underline-offset-4 transition-all"
        >
          {workspaceName}
        </button>
      )}

      {unsavedChanges && (
        <div className="w-1.5 h-1.5 rounded-full bg-syn-amber animate-pulse-dot" />
      )}

      {/* Center — presence */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="flex -space-x-2">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground ring-2 animate-presence-in"
              style={{ backgroundColor: c.color + '33', boxShadow: `0 0 0 2px ${c.color}` }}
              title={`${c.name} · ${c.activeNodeId ? `editing ${c.activeNodeId}` : 'idle'}`}
            >
              {c.name.split(' ').map(n => n[0]).join('')}
            </div>
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
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="h-8 px-3 text-xs font-ui text-syn-text-secondary bg-syn-raised border border-syn-border rounded-md hover:bg-syn-hover transition-all duration-150 flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>⌘K</span>
        </button>

        <button
          onClick={handleRun}
          className={cn(
            'h-9 px-4 text-sm font-display font-semibold rounded-md flex items-center gap-2 transition-all duration-150',
            isRunning
              ? 'bg-syn-red text-foreground animate-node-pulse'
              : 'bg-syn-violet text-foreground hover:brightness-110 active:scale-[0.97]'
          )}
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
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-foreground/20 ml-1">⌘R</kbd>
            </>
          )}
        </button>

        <button className="h-8 px-3 text-xs font-ui text-syn-text-secondary hover:bg-syn-hover rounded-md flex items-center gap-1.5 transition-all">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        <button className="h-8 px-3 text-xs font-ui text-syn-text-secondary hover:bg-syn-hover rounded-md flex items-center gap-1.5 transition-all">
          Export
          <ChevronDown className="w-3 h-3" />
        </button>

        <div className="w-8 h-8 rounded-full bg-syn-violet/20 flex items-center justify-center">
          <User className="w-4 h-4 text-syn-violet" />
        </div>
      </div>
    </div>
  );
}
