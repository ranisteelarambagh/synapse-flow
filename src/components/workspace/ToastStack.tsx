import { useWorkflowStore } from '@/stores/workflowStore';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const toastStyles = {
  success: {
    border: 'border-l-4 border-l-green-500',
    icon: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
    bg: 'bg-syn-raised',
  },
  error: {
    border: 'border-l-4 border-l-syn-red',
    icon: <AlertCircle className="w-4 h-4 text-syn-red shrink-0" />,
    bg: 'bg-syn-raised',
  },
  warn: {
    border: 'border-l-4 border-l-syn-amber',
    icon: <AlertTriangle className="w-4 h-4 text-syn-amber shrink-0" />,
    bg: 'bg-syn-raised',
  },
  info: {
    border: 'border-l-4 border-l-syn-violet',
    icon: <Info className="w-4 h-4 text-syn-violet shrink-0" />,
    bg: 'bg-syn-raised',
  },
};

export default function ToastStack() {
  const { toasts, removeToast } = useWorkflowStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.slice(-3).map((toast) => {
        const style = toastStyles[toast.type] || toastStyles.info;
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl',
              'border border-syn-border min-w-[280px] max-w-[380px]',
              'animate-toast-in',
              style.border,
              style.bg
            )}
          >
            {style.icon}
            <span className="text-sm font-ui text-foreground flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-syn-text-muted hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
