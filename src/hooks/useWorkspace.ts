import { useEffect, useRef, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useCollaborationStore } from '@/stores/collaborationStore';

export function useWorkspace(workspaceId: string) {
  // Only subscribe to the fields we actually need — avoids re-renders when nodes/edges change
  const unsavedChanges = useWorkflowStore(s => s.unsavedChanges);
  const setUnsavedChanges = useWorkflowStore(s => s.setUnsavedChanges);
  const addToast = useWorkflowStore(s => s.addToast);
  const { updateCursor, updateActiveNode } = useCollaborationStore();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      // Simulate network save — swap this for a real API call
      await new Promise<void>(r => setTimeout(r, 400));
      setUnsavedChanges(false);
    } catch {
      addToast({ type: 'error', message: 'Failed to save workspace' });
    } finally {
      isSavingRef.current = false;
    }
  }, [setUnsavedChanges, addToast]);

  // Debounced autosave — only depends on unsavedChanges, not on nodes/edges directly
  useEffect(() => {
    if (!unsavedChanges) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 2000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [unsavedChanges, save]);

  const reportCursor = useCallback((x: number, y: number) => {
    updateCursor(x, y);
  }, [updateCursor]);

  const reportNodeSelect = useCallback((nodeId: string | null) => {
    updateActiveNode(nodeId);
  }, [updateActiveNode]);

  return {
    save,
    isSaving: isSavingRef.current,
    reportCursor,
    reportNodeSelect,
  };
}
