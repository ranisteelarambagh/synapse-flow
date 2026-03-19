import { useRef, useEffect, useState, useMemo } from 'react';
import { useExecutionStore, type LogLevel } from '@/stores/executionStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Search, Trash2, Copy, CheckCheck } from 'lucide-react';

const LEVEL_CONFIG: Record<LogLevel, { fg: string; badge: string; dot: string }> = {
  INFO:  { fg: 'text-foreground',     badge: 'bg-foreground/10 text-foreground',     dot: 'bg-syn-border-active' },
  WARN:  { fg: 'text-syn-amber',      badge: 'bg-syn-amber/15 text-syn-amber',       dot: 'bg-syn-amber' },
  ERROR: { fg: 'text-syn-red',        badge: 'bg-syn-red/15 text-syn-red',           dot: 'bg-syn-red' },
  DEBUG: { fg: 'text-syn-text-code',  badge: 'bg-syn-text-code/10 text-syn-text-code', dot: 'bg-syn-text-code' },
};

const ALL_LEVELS: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];

export default function BottomPanel() {
  const { logs, isStreaming, clearLogs } = useExecutionStore();
  const { bottomPanelOpen, toggleBottomPanel } = useUIStore();
  const { isRunning } = useWorkflowStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(new Set(ALL_LEVELS));
  const [copied, setCopied] = useState(false);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current && bottomPanelOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, bottomPanelOpen]);

  const toggleFilter = (level: LogLevel) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        if (next.size > 1) next.delete(level); // keep at least one
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter(log =>
      activeFilters.has(log.level) &&
      (!q || log.message.toLowerCase().includes(q) || (log.nodeName || '').toLowerCase().includes(q))
    );
  }, [logs, activeFilters, search]);

  const handleCopyAll = async () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp.toLocaleTimeString('en', { hour12: false })}] ${l.level} [${l.nodeName || 'System'}] ${l.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const levelCounts = useMemo(() => {
    return ALL_LEVELS.reduce((acc, level) => {
      acc[level] = logs.filter(l => l.level === level).length;
      return acc;
    }, {} as Record<LogLevel, number>);
  }, [logs]);

  return (
    <div
      className={cn(
        'bg-[#090B10] border-t border-syn-border flex flex-col shrink-0 transition-all',
        bottomPanelOpen ? 'h-[240px]' : 'h-8'
      )}
      style={{ transitionDuration: '220ms', transitionTimingFunction: 'cubic-bezier(0.16,1,0.32,1)' }}
    >
      {/* Toggle / toolbar row */}
      <div className="h-8 shrink-0 flex items-center gap-2 px-3 border-b border-syn-border/50">
        <button
          onClick={toggleBottomPanel}
          className="flex items-center gap-1.5 text-[11px] font-ui text-syn-text-muted hover:text-syn-text-secondary transition-colors"
        >
          {bottomPanelOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          {isRunning ? (
            <span className="flex items-center gap-1.5 text-syn-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-syn-teal animate-pulse-dot" />
              RUNNING
            </span>
          ) : (
            <span>Terminal</span>
          )}
        </button>

        {bottomPanelOpen && (
          <>
            {/* Level filter pills */}
            <div className="flex items-center gap-1 ml-2">
              {ALL_LEVELS.map(level => {
                const cfg = LEVEL_CONFIG[level];
                const active = activeFilters.has(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleFilter(level)}
                    className={cn(
                      'flex items-center gap-1 px-1.5 h-5 rounded text-[9px] font-ui font-medium transition-all',
                      active ? cfg.badge : 'bg-syn-raised text-syn-text-muted opacity-50'
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', active ? cfg.dot : 'bg-syn-border-active')} />
                    {level}
                    {levelCounts[level] > 0 && (
                      <span className="opacity-70">{levelCounts[level]}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-syn-text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearch('')}
                placeholder="Filter logs..."
                className="w-full h-5 pl-6 pr-2 text-[11px] font-ui bg-syn-raised border border-syn-border rounded text-foreground placeholder:text-syn-text-muted focus:outline-none focus:border-syn-violet transition-all"
              />
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          {bottomPanelOpen && (
            <>
              <button
                onClick={handleCopyAll}
                className="h-5 px-1.5 flex items-center gap-1 text-[10px] font-ui text-syn-text-muted hover:text-foreground hover:bg-syn-hover rounded transition-all"
                title="Copy all logs"
              >
                {copied ? <CheckCheck className="w-3 h-3 text-syn-teal" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={clearLogs}
                className="h-5 px-1.5 flex items-center gap-1 text-[10px] font-ui text-syn-text-muted hover:text-syn-red hover:bg-syn-red/10 rounded transition-all"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
          <span className="text-[10px] font-ui text-syn-text-muted">Press ` to toggle</span>
        </div>
      </div>

      {/* Log viewer */}
      {bottomPanelOpen && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-1 font-mono text-[11px] leading-[1.6]"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-syn-text-muted text-[11px] font-ui">No logs match your filter.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO;
              return (
                <div
                  key={log.id}
                  className="flex items-baseline gap-2 px-3 py-0.5 hover:bg-white/[0.025] transition-colors group animate-fade-in-up"
                >
                  <span className="text-syn-text-muted shrink-0 w-[68px] text-right">
                    {log.timestamp.toLocaleTimeString('en', { hour12: false })}
                  </span>
                  <span
                    className={cn(
                      'w-[42px] shrink-0 text-center px-1 rounded text-[9px] font-semibold uppercase tracking-wide',
                      cfg.badge
                    )}
                  >
                    {log.level}
                  </span>
                  {log.nodeName && (
                    <span className="text-syn-violet/70 shrink-0 text-[10px]">[{log.nodeName}]</span>
                  )}
                  <span className={cn('flex-1', cfg.fg)}>{log.message}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(log.message)}
                    className="opacity-0 group-hover:opacity-100 text-syn-text-muted hover:text-foreground transition-all shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
          {/* Streaming cursor */}
          {isStreaming && (
            <div className="flex items-center gap-2 px-3 py-0.5 text-syn-teal">
              <span className="w-[68px]" />
              <span className="text-[11px] animate-pulse">▊</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
