import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, Copy, Layers, Link2Off, Eye, Clipboard } from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: typeof Trash2;
  danger?: boolean;
  separator?: boolean;
  shortcut?: string;
  action: () => void;
}

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeLabel: string;
  nodeId: string;
  onDelete: () => void;
  onDuplicate: () => void;
  onDisconnect: () => void;
  onCopyId: () => void;
  onInspect: () => void;
  onClose: () => void;
}

export default function NodeContextMenu({
  x, y,
  nodeLabel,
  nodeId,
  onDelete,
  onDuplicate,
  onDisconnect,
  onCopyId,
  onInspect,
  onClose,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') onClose();
      } else {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  // Clamp to viewport
  const menuW = 200;
  const menuH = 240;
  const clampedX = Math.min(x, window.innerWidth - menuW - 8);
  const clampedY = Math.min(y, window.innerHeight - menuH - 8);

  const items: ContextMenuItem[] = [
    {
      id: 'inspect',
      label: 'Inspect Node',
      icon: Eye,
      shortcut: 'Click',
      action: () => { onInspect(); onClose(); },
    },
    {
      id: 'copy-id',
      label: 'Copy Node ID',
      icon: Clipboard,
      action: () => { onCopyId(); onClose(); },
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      shortcut: '⌘D',
      action: () => { onDuplicate(); onClose(); },
    },
    {
      id: 'disconnect',
      label: 'Disconnect Edges',
      icon: Link2Off,
      action: () => { onDisconnect(); onClose(); },
    },
    {
      id: 'sep',
      label: '',
      icon: Trash2,
      separator: true,
      action: () => {},
    },
    {
      id: 'delete',
      label: 'Delete Node',
      icon: Trash2,
      danger: true,
      shortcut: '⌫',
      action: () => { onDelete(); onClose(); },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] w-[200px] rounded-xl border border-syn-border-active shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden animate-fade-in-up"
      style={{
        left: clampedX,
        top: clampedY,
        background: 'hsl(var(--bg-raised))',
        animationDuration: '120ms',
      }}
    >
      {/* Node label header */}
      <div className="px-3 py-2 border-b border-syn-border"
        style={{ background: 'hsl(var(--bg-surface))' }}>
        <div className="flex items-center gap-2">
          <Layers className="w-3 h-3 text-syn-violet shrink-0" />
          <span className="text-[12px] font-display font-semibold text-foreground truncate">{nodeLabel}</span>
        </div>
        <div className="text-[9px] font-mono text-syn-text-muted mt-0.5 truncate">node_{nodeId.slice(0, 8)}</div>
      </div>

      {/* Menu items */}
      <div className="p-1">
        {items.map(item => {
          if (item.separator) {
            return <div key={item.id} className="h-px bg-syn-border/60 my-1 mx-2" />;
          }
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 h-8 rounded-lg text-left transition-all group',
                item.danger
                  ? 'text-syn-red/80 hover:bg-syn-red/10 hover:text-syn-red'
                  : 'text-syn-text-secondary hover:bg-syn-hover hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[12px] font-ui">{item.label}</span>
              </span>
              {item.shortcut && (
                <kbd className="text-[9px] px-1 py-0.5 rounded bg-syn-hover border border-syn-border text-syn-text-muted group-hover:border-syn-border-active">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
