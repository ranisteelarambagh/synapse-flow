import { useState, useRef, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useCanvasApiStore } from '@/stores/canvasApiStore';
import { startVoiceRecording } from '@/lib/collaboration';
import { NODE_CONFIGS } from '@/lib/nodeConfigs';
import { nanoid } from 'nanoid';
import type { Node } from '@xyflow/react';
import type { NodeData } from '@/stores/workflowStore';

const VOICE_NODE_MAP: Record<string, string> = {
  'agent': 'agent',
  'ai agent': 'agent',
  'llm': 'llm-call',
  'language model': 'llm-call',
  'gpt': 'llm-call',
  'memory': 'memory',
  'http': 'http-request',
  'api call': 'http-request',
  'fetch': 'http-request',
  'request': 'http-request',
  'input': 'input',
  'trigger': 'input',
  'webhook': 'input',
  'output': 'output',
  'result': 'output',
  'router': 'router',
  'branch': 'router',
  'if': 'router',
  'loop': 'loop',
  'iterate': 'loop',
  'code': 'code-runner',
  'script': 'code-runner',
  'python': 'code-runner',
  'embed': 'embedder',
  'embedder': 'embedder',
  'classify': 'classifier',
  'classifier': 'classifier',
};

export function useVoice(_workspaceId: string) {
  const [isRecording, setIsRecording] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const { setVoiceTranscript, voiceTranscript, addToast } = useWorkflowStore();

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setVoiceTranscript('');

    const stop = startVoiceRecording((text, isFinal) => {
      setVoiceTranscript(text);

      if (isFinal) {
        const lower = text.toLowerCase();

        for (const [kw, type] of Object.entries(VOICE_NODE_MAP)) {
          if (lower.includes(kw)) {
            const cfg = NODE_CONFIGS[type];
            const newNode: Node<NodeData> = {
              id: `${type}-${nanoid(6)}`,
              type: 'synapse',
              position: {
                x: 150 + Math.random() * 350,
                y: 100 + Math.random() * 250,
              },
              data: {
                label: cfg?.label || type,
                category: cfg?.category || 'ai',
                nodeType: type,
                status: 'idle',
                icon: cfg?.icon || '🤖',
                config: cfg ? { ...cfg.defaultConfig } : {},
                inputs: cfg?.inputs || ['input'],
                outputs: cfg?.outputs || ['output'],
              },
            };

            // Imperatively add to canvas via the canvas API bus — no store sync loop
            const canvasAddNode = useCanvasApiStore.getState().addNode;
            if (canvasAddNode) {
              canvasAddNode(newNode);
              addToast({ type: 'success', message: `🎤 Created "${cfg?.label || type}" from voice` });
            } else {
              addToast({ type: 'warn', message: 'Canvas not ready — try again' });
            }
            break;
          }
        }
      }
    });

    stopRef.current = stop;
  }, [setVoiceTranscript, addToast]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    setTimeout(() => setVoiceTranscript(''), 2000);
  }, [setVoiceTranscript]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    transcript: voiceTranscript,
  };
}
