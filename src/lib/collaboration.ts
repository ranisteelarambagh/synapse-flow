import * as Y from 'yjs';
import { nanoid } from 'nanoid';

let doc: Y.Doc | null = null;
let provider: any = null;

export function getYDoc(): Y.Doc {
  if (!doc) {
    doc = new Y.Doc();
  }
  return doc;
}

export function initCollaboration(workspaceId: string, userId: string, onCursorUpdate: (cursors: Record<string, { x: number; y: number; name: string; color: string }>) => void) {
  const d = getYDoc();
  const awareness = d.getMap('awareness');

  const localState = {
    userId,
    cursor: null as { x: number; y: number } | null,
    name: 'You',
    color: '#6C63FF',
    activeNodeId: null as string | null,
  };

  awareness.set(userId, localState);

  awareness.observe(() => {
    const cursors: Record<string, { x: number; y: number; name: string; color: string }> = {};
    awareness.forEach((value: any, key: string) => {
      if (key !== userId && value?.cursor) {
        cursors[key] = {
          x: value.cursor.x,
          y: value.cursor.y,
          name: value.name || 'Unknown',
          color: value.color || '#888',
        };
      }
    });
    onCursorUpdate(cursors);
  });

  return {
    updateCursor: (x: number, y: number) => {
      localState.cursor = { x, y };
      awareness.set(userId, { ...localState });
    },
    updateNodeSelect: (nodeId: string | null) => {
      localState.activeNodeId = nodeId;
      awareness.set(userId, { ...localState });
    },
    destroy: () => {
      awareness.delete(userId);
    },
  };
}

export function destroyCollaboration() {
  if (provider) {
    provider = null;
  }
}

export function startVoiceRecording(onTranscript: (text: string, isFinal: boolean) => void): () => void {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }
    if (final) onTranscript(final, true);
    else if (interim) onTranscript(interim, false);
  };

  recognition.onerror = (e: any) => {
    console.warn('Speech recognition error:', e.error);
  };

  recognition.start();

  return () => {
    try { recognition.stop(); } catch {}
  };
}
