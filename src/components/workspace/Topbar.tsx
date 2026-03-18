import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useUIStore } from '@/stores/uiStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { Play, Square, Search, Share2, ChevronDown, User, Mic, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportJSON, exportLangGraph, downloadFile, shareWorkflow } from '@/lib/exportUtils';

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
  const { workspaceName, setWorkspaceName, unsavedChanges, isRunning, setIsRunning, nodes, edges } = useWorkflowStore();
  const { setCommandPaletteOpen } = useUIStore();
  const { collaborators } = useCollaborationStore();

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(workspaceName);
  const [isRecording, setIsRecording] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
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

  const getCollaboratorAction = (c: typeof collaborators[0]) => {
    if (c.activeNodeId) return `editing ${c.activeNodeId}`;
    return 'idle';
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
      const shareUrl = await shareWorkflow(selectedNodeId || 'default');
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied!');
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to generate share link');
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
              <Tooltip key={c.id}>
                <TooltipTrigger asChild>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground ring-2 animate-presence-in cursor-default"
                    style={{ backgroundColor: c.color + '33', boxShadow: `0 0 0 2px ${c.color}` }}
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
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="h-8 px-3 text-xs font-ui text-syn-text-secondary bg-syn-raised border border-syn-border rounded-md hover:bg-syn-hover transition-all duration-150 flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>⌘K</span>
          </button>

          <button
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            onMouseLeave={() => setIsRecording(false)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150',
              isRecording
                ? 'bg-syn-red text-foreground animate-pulse'
                : 'text-syn-text-secondary hover:bg-syn-hover'
            )}
          >
            <Mic className="w-3.5 h-3.5" />
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

          <button
            onClick={handleShare}
            disabled={sharing}
            className="h-8 px-3 text-xs font-ui text-syn-text-secondary hover:bg-syn-hover rounded-md flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            {sharing ? 'Sharing...' : 'Share'}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="h-8 px-3 text-xs font-ui text-syn-text-secondary hover:bg-syn-hover rounded-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className={cn('w-3 h-3 transition-transform', exportOpen && 'rotate-180')} />
            </button>

            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute top-full right-0 mt-1 z-40 bg-syn-raised border border-syn-border rounded-md shadow-lg min-w-40">
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-3 py-2 text-left text-xs font-ui text-syn-text-secondary hover:text-foreground hover:bg-syn-hover transition-all flex items-center gap-2"
                  >
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={handleExportPython}
                    className="w-full px-3 py-2 text-left text-xs font-ui text-syn-text-secondary hover:text-foreground hover:bg-syn-hover transition-all flex items-center gap-2"
                  >
                    <span>Python</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-syn-violet/20 flex items-center justify-center">
            <User className="w-4 h-4 text-syn-violet" />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
