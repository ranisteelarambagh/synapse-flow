import { useState, useRef, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { startVoiceRecording } from '@/lib/collaboration';
import { nanoid } from 'nanoid';

export function useVoice(workspaceId: string) {
  const [isRecording, setIsRecording] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const { setVoiceTranscript, voiceTranscript, nodes, setNodes, addToast } = useWorkflowStore();

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setVoiceTranscript('');

    const stop = startVoiceRecording((text, isFinal) => {
      setVoiceTranscript(text);
      if (isFinal) {
        const lower = text.toLowerCase();
        const nodeKeywords: Record<string, string> = {
          'agent': 'agent', 'ai agent': 'agent',
          'llm': 'llm-call', 'language model': 'llm-call',
          'memory': 'memory',
          'http': 'http-request', 'api call': 'http-request', 'fetch': 'http-request',
          'input': 'input',
          'output': 'output',
          'router': 'router', 'branch': 'router',
          'loop': 'loop',
          'code': 'code-runner', 'script': 'code-runner',
        };

        for (const [kw, type] of Object.entries(nodeKeywords)) {
          if (lower.includes(kw)) {
            const newNode = {
              id: `${type}-${nanoid(6)}`,
              type: 'synapse' as const,
              position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
              data: {
                label: type.charAt(0).toUpperCase() + type.slice(1),
                category: 'ai' as const,
                nodeType: type,
                status: 'idle' as const,
                icon: '🤖',
                config: {},
                inputs: ['input'],
                outputs: ['output'],
              },
            };
            setNodes([...nodes, newNode as any]);
            addToast({ type: 'success', message: `Created ${type} node from voice command!` });
            break;
          }
        }
      }
    });

    stopRef.current = stop;
  }, [nodes, setNodes, setVoiceTranscript, addToast]);

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
