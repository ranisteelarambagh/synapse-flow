import { cn } from '@/lib/utils';
import { useUIStore, type MobileTab } from '@/stores/uiStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useExecutionStore } from '@/stores/executionStore';
import { Layers, Cpu, Sliders, Terminal } from 'lucide-react';

const tabs: { id: MobileTab; icon: typeof Layers; label: string }[] = [
  { id: 'nodes',     icon: Layers,   label: 'Nodes'    },
  { id: 'canvas',    icon: Cpu,      label: 'Canvas'   },
  { id: 'inspector', icon: Sliders,  label: 'Inspector'},
  { id: 'terminal',  icon: Terminal, label: 'Terminal' },
];

export default function MobileNav() {
  const { activeMobileTab, setActiveMobileTab, setMobileDrawer } = useUIStore();
  const { isRunning } = useWorkflowStore();
  const { logs } = useExecutionStore();
  const errorCount = logs.filter(l => l.level === 'ERROR').length;

  const handleTab = (tab: MobileTab) => {
    setActiveMobileTab(tab);
    if (tab === 'nodes') setMobileDrawer('left');
    else if (tab === 'inspector') setMobileDrawer('right');
    else setMobileDrawer('none');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[80] h-16 border-t border-syn-border"
      style={{
        background: 'rgba(8,10,18,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="h-full flex items-center justify-around px-2">
        {tabs.map(({ id, icon: Icon, label }) => {
          const active = activeMobileTab === id;
          const hasAlert = (id === 'terminal' && errorCount > 0) || (id === 'canvas' && isRunning);

          return (
            <button
              key={id}
              onClick={() => handleTab(id)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200',
                active ? 'text-syn-violet' : 'text-syn-text-muted'
              )}
            >
              {/* Active indicator bar at top */}
              <span
                className={cn(
                  'absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b transition-all duration-300',
                  active ? 'bg-syn-violet opacity-100' : 'opacity-0'
                )}
              />
              <div className={cn(
                'w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200',
                active ? 'bg-syn-violet/15' : 'bg-transparent'
              )}>
                <Icon className="w-5 h-5" />
                {hasAlert && (
                  <span className={cn(
                    'absolute top-2.5 right-[30%] w-2 h-2 rounded-full',
                    id === 'terminal' ? 'bg-syn-red' : 'bg-syn-teal animate-pulse-dot'
                  )} />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-ui font-medium transition-all',
                active ? 'text-syn-violet' : 'text-syn-text-muted'
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
