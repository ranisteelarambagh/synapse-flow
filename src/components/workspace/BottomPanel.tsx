import { useRef, useEffect } from 'react';
import { useExecutionStore } from '@/stores/executionStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

const levelColors: Record<string, string> = {
  INFO: 'text-foreground',
  WARN: 'text-syn-amber',
  ERROR: 'text-syn-red',
  DEBUG: 'text-syn-text-code',
};

const levelBg: Record<string, string> = {
  INFO: 'bg-foreground/10',
  WARN: 'bg-syn-amber/10',
  ERROR: 'bg-syn-red/10',
  DEBUG: 'bg-syn-text-code/10',
};

export default function BottomPanel() {
  const { logs, isStreaming, clearLogs } = useExecutionStore();
  const { bottomPanelOpen, toggleBottomPanel } = useUIStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className={cn(
        'bg-[#0D0F14] border-t border-syn-border transition-all duration-250 flex flex-col',
        bottomPanelOpen ? 'h-[200px]' : 'h-8'
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.32, 1)' }}
    >
      {/* Toggle bar */}
      <button
        onClick={toggleBottomPanel}
        className="h-8 shrink-0 flex items-center gap-2 px-3 text-[11px] font-ui text-syn-text-muted hover:text-syn-text-secondary transition-colors"
      >
        {bottomPanelOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        <span>Terminal</span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-syn-teal">
            <span className="w-1.5 h-1.5 rounded-full bg-syn-teal animate-pulse-dot" />
            RUNNING
          </span>
        )}
        <span className="ml-auto text-[10px]">Press ` to toggle</span>
      </button>

      {/* Logs */}
      {bottomPanelOpen && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-2 font-mono text-xs leading-relaxed">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 py-0.5 animate-in fade-in duration-100">
              <span className="w-[72px] shrink-0 text-syn-text-muted">
                {log.timestamp.toLocaleTimeString('en', { hour12: false })}
              </span>
              <span className={cn('w-12 shrink-0 text-center px-1 py-0 rounded text-[10px] font-semibold', levelColors[log.level], levelBg[log.level])}>
                {log.level}
              </span>
              {log.nodeName && (
                <span className="text-syn-text-muted shrink-0">[{log.nodeName}]</span>
              )}
              <span className="text-syn-text-secondary">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
