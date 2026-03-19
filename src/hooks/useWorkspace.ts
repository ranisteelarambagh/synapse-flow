import { useEffect, useRef, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useCollaborationStore } from '@/stores/collaborationStore';

export function useWorkspace(workspaceId: string) {
  const { unsavedChanges, setUnsavedChanges, nodes, edges, addToast } = useWorkflowStore();
  const { updateCursor } = useCollaborationStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      await new Promise(r => setTimeout(r, 400));
      setUnsavedChanges(false);
    } catch {
      addToast({ type: 'error', message: 'Failed to save workspace' });
    } finally {
      isSavingRef.current = false;
    }
  }, [setUnsavedChanges, addToast]);

  useEffect(() => {
    if (!unsavedChanges) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 2000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [unsavedChanges, nodes, edges, save]);

  const reportCursor = useCallback((x: number, y: number) => {
    updateCursor(x, y);
  }, [updateCursor]);

  const reportNodeSelect = useCallback((nodeId: string | null) => {
    useCollaborationStore.getState().updateActiveNode(nodeId);
  }, []);

  return {
    save,
    isSaving: isSavingRef.current,
    reportCursor,
    reportNodeSelect,
  };
}
